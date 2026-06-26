import { router } from "expo-router";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

export default function VerifyEmailScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Check your email 📧</Text>

            <Text style={styles.subtitle}>
                We've sent you a verification email.
                {"\n\n"}
                Please verify your account before signing in.
            </Text>

            <TouchableOpacity style={styles.button} onPress={() => router.replace("/login")}>
                <Text style={styles.buttonText}>Back to Login</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        padding: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: "700",
        marginBottom: 16,
        textAlign: "center",
    },
    subtitle: {
        fontSize: 16,
        textAlign: "center",
        lineHeight: 24,
        color: "#666",
        marginBottom: 32,
    },
    button: {
        backgroundColor: "#000",
        padding: 16,
        borderRadius: 10,
    },
    buttonText: {
        color: "#fff",
        textAlign: "center",
        fontWeight: "600",
    },
});
