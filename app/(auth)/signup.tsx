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
    ScrollView,
} from "react-native";
import { colors, componentStyles, spacing, typography } from "../../theme/theme";
import ScreenWrapper from "../../components/layout/ScreenWrapper";
import { router } from "expo-router";
import { useAuth } from "@/context/AuthContext";

export default function SignUpScreen({ navigation }: any) {
    // const [fullName, setFullName] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const { signUp } = useAuth();

    const handleSignUp = async () => {
        if (
            !firstName.trim() ||
            !lastName.trim() ||
            !phone.trim() ||
            !email.trim() ||
            !password.trim() ||
            !confirmPassword.trim()
        ) {
            Alert.alert("Missing fields", "Please fill in all fields.");
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert("Password mismatch", "Password and confirm password must match.");
            return;
        }

        try {
            setLoading(true);

            await signUp({
                firstName,
                lastName,
                phone,
                email,
                password,
            });

            router.replace("/auth/verify-email");
        } catch (error: any) {
            Alert.alert("Sign Up Failed", error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScreenWrapper scrollable={false} withTabBar={false}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.container}>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps='handled'
                    contentContainerStyle={styles.scrollContent}>
                    <View style={styles.header}>
                        <Text style={styles.brand}>Modern Mum Co</Text>
                        <Text style={styles.title}>Create account</Text>
                        <Text style={styles.subtitle}>Join us to continue</Text>
                    </View>

                    <View style={componentStyles.card}>
                        <Text style={componentStyles.inputLabel}>First name</Text>
                        <TextInput
                            value={firstName}
                            onChangeText={setFirstName}
                            placeholder='Enter your first name'
                            placeholderTextColor={colors.charcoalLight}
                            autoCapitalize='words'
                            style={componentStyles.input}
                        />

                        <View style={{ height: spacing.md }} />

                        <Text style={componentStyles.inputLabel}>Last name</Text>
                        <TextInput
                            value={lastName}
                            onChangeText={setLastName}
                            placeholder='Enter your last name'
                            placeholderTextColor={colors.charcoalLight}
                            autoCapitalize='words'
                            style={componentStyles.input}
                        />

                        <View style={{ height: spacing.md }} />

                        <Text style={componentStyles.inputLabel}>Email</Text>
                        <TextInput
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

                        <Text style={componentStyles.inputLabel}>Phone number</Text>
                        <TextInput
                            value={phone}
                            onChangeText={setPhone}
                            placeholder='Enter your phone number'
                            placeholderTextColor={colors.charcoalLight}
                            keyboardType='phone-pad'
                            autoCapitalize='none'
                            autoCorrect={false}
                            style={componentStyles.input}
                        />

                        <View style={{ height: spacing.md }} />

                        <Text style={componentStyles.inputLabel}>Password</Text>
                        <TextInput
                            value={password}
                            onChangeText={setPassword}
                            placeholder='Create password'
                            placeholderTextColor={colors.charcoalLight}
                            secureTextEntry
                            autoCapitalize='none'
                            autoCorrect={false}
                            style={componentStyles.input}
                        />

                        <View style={{ height: spacing.md }} />

                        <Text style={componentStyles.inputLabel}>Confirm password</Text>
                        <TextInput
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            placeholder='Re-enter password'
                            placeholderTextColor={colors.charcoalLight}
                            secureTextEntry
                            autoCapitalize='none'
                            autoCorrect={false}
                            style={componentStyles.input}
                        />

                        <TouchableOpacity
                            style={[componentStyles.buttonGold, styles.primaryButton, loading && styles.disabledButton]}
                            activeOpacity={0.85}
                            onPress={handleSignUp}
                            disabled={loading}>
                            <Text style={componentStyles.buttonGoldText}>{loading ? "CREATING..." : "SIGN UP"}</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Already have an account?</Text>
                        <TouchableOpacity onPress={() => router.push("/login")}>
                            <Text style={styles.footerLink}> Sign in</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: "center",
        padding: spacing.lg,
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
