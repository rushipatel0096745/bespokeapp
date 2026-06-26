import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, typography, spacing } from "../../theme/theme";

interface PromoBannerProps {
    text: string;
}

export default function PromoBanner({ text }: PromoBannerProps) {
    return (
        <View style={styles.banner}>
            <Text style={styles.text}>{text}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    banner: {
        backgroundColor: colors.creamMid,
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.md,
        alignItems: "center",
    },
    text: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.xs,
        color: colors.charcoal,
        letterSpacing: 0.3,
        textAlign: "center",
    },
});
