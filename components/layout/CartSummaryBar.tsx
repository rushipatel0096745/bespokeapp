// components/CartSummaryBar.tsx
import React from "react";
import { useRouter } from "expo-router";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useCart } from "@/hooks/useCart";
import { colors, radii, shadows, spacing, typography } from "@/theme/theme";

function formatPrice(value: number) {
    return `£${value.toFixed(2)}`;
}

function BasketBar({ count, total, onPress }: { count: number; total: number; onPress: () => void }) {
    if (count === 0) return null;
    return (
        <View style={styles.basketBar}>
            <View>
                <Text style={styles.basketBarCount}>
                    {count} item{count !== 1 ? "s" : ""} in basket
                </Text>
                <Text style={styles.basketBarTotal}>{formatPrice(total)}</Text>
            </View>
            <TouchableOpacity
                style={styles.basketBarBtn}
                onPress={onPress}
                accessibilityRole='button'
                accessibilityLabel='View basket'>
                <Text style={styles.basketBarBtnText}>View basket →</Text>
            </TouchableOpacity>
        </View>
    );
}

export function CartSummaryBar({ orderId }: { orderId: string }) {
    const router = useRouter();
    const { data: cart } = useCart(orderId);

    const count = cart?.items.reduce((sum, i) => sum + i.quantity, 0) ?? 0;
    const total = cart?.total ?? 0;

    return <BasketBar count={count} total={total} onPress={() => router.push(`/add-ons/${orderId}/cart`)} />;
}

const styles = StyleSheet.create({
    basketBar: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: colors.charcoal,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderTopWidth: 0.5,
        borderTopColor: colors.charcoalMid,
        ...shadows.nav,
    },
    basketBarCount: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.xs,
        color: colors.charcoalLight,
        letterSpacing: 0.3,
    },
    basketBarTotal: {
        fontFamily: typography.fonts.sansMedium,
        fontSize: typography.sizes.lg,
        color: colors.gold,
        marginTop: spacing.xxs,
    },
    basketBarBtn: {
        backgroundColor: colors.gold,
        borderRadius: radii.md,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
    },
    basketBarBtnText: {
        fontFamily: typography.fonts.sansMedium,
        fontSize: typography.sizes.md,
        color: colors.charcoal,
    },
});
