// app/(tabs)/add-ons/basket.tsx
// Modern Mum Co — Basket Screen
// Uses temporary useBasket() hook — works fully offline, no backend needed

import React, { useState } from "react";
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    Image,
    Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useBasket, BasketItem } from "@/hooks/useBasket";
import { colors, typography, spacing, radii, shadows } from "@/theme/theme";
import ScreenWrapper from "@/components/layout/ScreenWrapper";
import NavBar from "@/components/layout/NavBar";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (pence: number) => `£${(pence / 100).toFixed(2)}`;

// ─── Sub-components ───────────────────────────────────────────────────────────

function NavBar1() {
    const router = useRouter();
    return (
        <View style={styles.navBar}>
            <TouchableOpacity
                onPress={() => router.back()}
                style={styles.backBtn}
                accessibilityRole='button'
                accessibilityLabel='Go back'>
                <Text style={styles.backText}>‹ Add-ons</Text>
            </TouchableOpacity>
            <Text style={styles.navTitle}>Your basket</Text>
            <View style={{ width: 72 }} />
        </View>
    );
}

function BasketRow({
    item,
    onIncrement,
    onDecrement,
    onRemove,
}: {
    item: BasketItem;
    onIncrement: () => void;
    onDecrement: () => void;
    onRemove: () => void;
}) {
    return (
        <View style={styles.row}>
            {/* Image */}
            <View style={styles.rowImageWrap}>
                {item.imageUrl ? (
                    <Image
                        source={{ uri: item.imageUrl }}
                        style={styles.rowImage}
                        resizeMode='cover'
                        accessibilityLabel={item.name}
                    />
                ) : (
                    <View style={styles.rowImagePlaceholder}>
                        <Text style={styles.rowImagePlaceholderText}>✦</Text>
                    </View>
                )}
            </View>

            {/* Info */}
            <View style={styles.rowInfo}>
                <Text style={styles.rowName} numberOfLines={2}>
                    {item.name}
                </Text>
                <Text style={styles.rowPrice}>{fmt(item.price)}</Text>

                {/* Qty stepper */}
                <View style={styles.stepper}>
                    <TouchableOpacity
                        style={styles.stepperBtn}
                        onPress={onDecrement}
                        accessibilityRole='button'
                        accessibilityLabel={item.quantity === 1 ? "Remove item" : "Decrease quantity"}>
                        <Text style={styles.stepperBtnText}>−</Text>
                    </TouchableOpacity>

                    <Text style={styles.stepperQty}>{item.quantity}</Text>

                    <TouchableOpacity
                        style={styles.stepperBtn}
                        onPress={onIncrement}
                        accessibilityRole='button'
                        accessibilityLabel='Increase quantity'>
                        <Text style={styles.stepperBtnText}>+</Text>
                    </TouchableOpacity>

                    <Text style={styles.rowLineTotal}>= {fmt(item.price * item.quantity)}</Text>
                </View>
            </View>

            {/* Remove */}
            <TouchableOpacity
                style={styles.removeBtn}
                onPress={onRemove}
                accessibilityRole='button'
                accessibilityLabel={`Remove ${item.name} from basket`}>
                <Text style={styles.removeBtnText}>✕</Text>
            </TouchableOpacity>
        </View>
    );
}

function EmptyBasket() {
    const router = useRouter();
    return (
        <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>✦</Text>
            <Text style={styles.emptyTitle}>Your basket is empty</Text>
            <Text style={styles.emptySub}>Add extra prints, keyrings, or frame upgrades before we start foiling.</Text>
            <TouchableOpacity style={styles.browseBtn} onPress={() => router.back()} accessibilityRole='button'>
                <Text style={styles.browseBtnText}>Browse add-ons</Text>
            </TouchableOpacity>
        </View>
    );
}

function PromoCodeRow() {
    return (
        <View style={styles.promoRow}>
            <View style={styles.promoCodePill}>
                <Text style={styles.promoCodeLabel}>Promo code applied</Text>
                <Text style={styles.promoCode}>EXTRA-20</Text>
            </View>
            <Text style={styles.promoDiscount}>−20%</Text>
        </View>
    );
}

function OrderSummary({ subtotal, hasPromo }: { subtotal: number; hasPromo: boolean }) {
    const discount = hasPromo ? Math.round(subtotal * 0.2) : 0;
    const total = subtotal - discount;

    return (
        <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Order summary</Text>

            <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>{fmt(subtotal)}</Text>
            </View>

            {hasPromo && (
                <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { color: colors.success }]}>EXTRA-20 (20% off)</Text>
                    <Text style={[styles.summaryValue, { color: colors.success }]}>−{fmt(discount)}</Text>
                </View>
            )}

            <View style={styles.summaryDivider} />

            <View style={styles.summaryRow}>
                <Text style={styles.summaryTotal}>Total</Text>
                <Text style={styles.summaryTotalValue}>{fmt(total)}</Text>
            </View>

            <Text style={styles.summaryNote}>Add-ons are combined with your foil order — no separate postage.</Text>
        </View>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function BasketScreen() {
    const router = useRouter();
    const { items, total, itemCount, increment, decrement, removeItem, clear } = useBasket();

    // In the real flow, hasPromo is true when customer tapped "OK, YES!" on the
    // EXTRA-20 soft retry in the chat. For now, hardcoded false.
    const hasPromo = false;

    const handleRemove = (item: BasketItem) => {
        Alert.alert("Remove item", `Remove "${item.name}" from your basket?`, [
            { text: "Cancel", style: "cancel" },
            {
                text: "Remove",
                style: "destructive",
                onPress: () => removeItem(item.productId),
            },
        ]);
    };

    const handleClearBasket = () => {
        Alert.alert("Clear basket", "Remove all items from your basket?", [
            { text: "Cancel", style: "cancel" },
            { text: "Clear", style: "destructive", onPress: clear },
        ]);
    };

    const handleCheckout = () => {
        // TODO: Replace with Stripe PaymentSheet when ready
        // services/stripe.ts → createPaymentIntent(total, linkedTicketId)
        router.push("/(tabs)/add-ons/checkout");
    };

    if (items.length === 0) {
        return (
            <SafeAreaView style={styles.safe}>
                <StatusBar barStyle='light-content' backgroundColor={colors.charcoal} />
                <NavBar />
                <EmptyBasket />
            </SafeAreaView>
        );
    }

    return (
        <ScreenWrapper scrollable={false} header={<NavBar variant="back" title="Basket" />}>
            <View style={{ flex: 1 }}>
                <FlatList
                    data={items}
                    keyExtractor={(item) => item.productId}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListHeaderComponent={
                        <>
                            {hasPromo && <PromoCodeRow />}
                            <View style={styles.listHeader}>
                                <Text style={styles.listHeaderText}>
                                    {itemCount} item{itemCount !== 1 ? "s" : ""}
                                </Text>
                                <TouchableOpacity
                                    onPress={handleClearBasket}
                                    accessibilityRole='button'
                                    accessibilityLabel='Clear basket'>
                                    <Text style={styles.clearAllText}>Clear all</Text>
                                </TouchableOpacity>
                            </View>
                        </>
                    }
                    renderItem={({ item }) => (
                        <BasketRow
                            item={item}
                            onIncrement={() => increment(item.productId)}
                            onDecrement={() => decrement(item.productId)}
                            onRemove={() => handleRemove(item)}
                        />
                    )}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                    ListFooterComponent={<OrderSummary subtotal={total} hasPromo={hasPromo} />}
                />
            </View>

            {/* Checkout bar */}
            <View style={styles.checkoutBar}>
                <View>
                    <Text style={styles.checkoutBarLabel}>
                        {itemCount} item{itemCount !== 1 ? "s" : ""}
                    </Text>
                    <Text style={styles.checkoutBarTotal}>{fmt(hasPromo ? Math.round(total * 0.8) : total)}</Text>
                </View>
                <TouchableOpacity
                    style={styles.checkoutBtn}
                    onPress={handleCheckout}
                    activeOpacity={0.85}
                    accessibilityRole='button'
                    accessibilityLabel='Proceed to checkout'>
                    <Text style={styles.checkoutBtnText}>Checkout →</Text>
                </TouchableOpacity>
            </View>
        </ScreenWrapper>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: colors.charcoal,
    },

    // Nav
    navBar: {
        backgroundColor: colors.charcoal,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    backBtn: { width: 72 },
    backText: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.md,
        color: colors.gold,
    },
    navTitle: {
        fontFamily: typography.fonts.sansMedium,
        fontSize: typography.sizes.md,
        color: colors.white,
    },

    // List
    listContent: {
        backgroundColor: colors.cream,
        paddingBottom: spacing.xl,
    },

    listHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
        paddingBottom: spacing.sm,
    },
    listHeaderText: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.sm,
        color: colors.charcoalLight,
        letterSpacing: 0.3,
    },
    clearAllText: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.sm,
        color: colors.error,
    },

    separator: {
        height: 0.5,
        backgroundColor: colors.border,
        marginHorizontal: spacing.lg,
    },

    // Basket row
    row: {
        flexDirection: "row",
        alignItems: "flex-start",
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        backgroundColor: colors.white,
        gap: spacing.md,
    },
    rowImageWrap: {
        width: 72,
        height: 80,
        borderRadius: radii.md,
        overflow: "hidden",
        borderWidth: 0.5,
        borderColor: colors.border,
        flexShrink: 0,
    },
    rowImage: {
        width: "100%",
        height: "100%",
    },
    rowImagePlaceholder: {
        width: "100%",
        height: "100%",
        backgroundColor: colors.goldPale,
        alignItems: "center",
        justifyContent: "center",
    },
    rowImagePlaceholderText: {
        fontSize: 18,
        color: colors.gold,
    },
    rowInfo: {
        flex: 1,
    },
    rowName: {
        fontFamily: typography.fonts.sansMedium,
        fontSize: typography.sizes.md,
        color: colors.charcoal,
        lineHeight: typography.sizes.md * 1.4,
        marginBottom: spacing.xxs,
    },
    rowPrice: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.sm,
        color: colors.charcoalLight,
        marginBottom: spacing.sm,
    },

    // Qty stepper
    stepper: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
    },
    stepperBtn: {
        width: 28,
        height: 28,
        borderRadius: radii.full,
        borderWidth: 0.5,
        borderColor: colors.border,
        backgroundColor: colors.cream,
        alignItems: "center",
        justifyContent: "center",
    },
    stepperBtnText: {
        fontFamily: typography.fonts.sansMedium,
        fontSize: typography.sizes.lg,
        color: colors.charcoal,
        lineHeight: typography.sizes.lg,
    },
    stepperQty: {
        fontFamily: typography.fonts.sansMedium,
        fontSize: typography.sizes.md,
        color: colors.charcoal,
        minWidth: 20,
        textAlign: "center",
    },
    rowLineTotal: {
        fontFamily: typography.fonts.sansMedium,
        fontSize: typography.sizes.sm,
        color: colors.gold,
        marginLeft: spacing.xs,
    },

    // Remove button
    removeBtn: {
        padding: spacing.xs,
        marginTop: spacing.xxs,
    },
    removeBtnText: {
        fontSize: typography.sizes.sm,
        color: colors.charcoalLight,
    },

    // Promo code
    promoRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: colors.goldPale,
        borderBottomWidth: 0.5,
        borderColor: colors.borderGold,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
    },
    promoCodePill: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
    },
    promoCodeLabel: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.sm,
        color: colors.charcoalMid,
    },
    promoCode: {
        fontFamily: typography.fonts.sansMedium,
        fontSize: typography.sizes.sm,
        color: colors.gold,
        backgroundColor: colors.white,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xxs,
        borderRadius: radii.xs,
        borderWidth: 0.5,
        borderColor: colors.borderGold,
    },
    promoDiscount: {
        fontFamily: typography.fonts.sansMedium,
        fontSize: typography.sizes.md,
        color: colors.success,
    },

    // Order summary
    summaryCard: {
        margin: spacing.lg,
        backgroundColor: colors.white,
        borderRadius: radii.lg,
        borderWidth: 0.5,
        borderColor: colors.border,
        padding: spacing.lg,
        ...shadows.card,
    },
    summaryTitle: {
        fontFamily: typography.fonts.sansMedium,
        fontSize: typography.sizes.md,
        color: colors.charcoal,
        marginBottom: spacing.md,
    },
    summaryRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: spacing.xs,
    },
    summaryLabel: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.md,
        color: colors.charcoalMid,
    },
    summaryValue: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.md,
        color: colors.charcoalMid,
    },
    summaryDivider: {
        height: 0.5,
        backgroundColor: colors.border,
        marginVertical: spacing.sm,
    },
    summaryTotal: {
        fontFamily: typography.fonts.sansMedium,
        fontSize: typography.sizes.lg,
        color: colors.charcoal,
    },
    summaryTotalValue: {
        fontFamily: typography.fonts.sansMedium,
        fontSize: typography.sizes.lg,
        color: colors.charcoal,
    },
    summaryNote: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.xs,
        color: colors.charcoalLight,
        marginTop: spacing.md,
        lineHeight: typography.sizes.xs * 1.6,
    },

    // Empty state
    emptyState: {
        flex: 1,
        backgroundColor: colors.cream,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: spacing.xl,
    },
    emptyIcon: {
        fontSize: 36,
        color: colors.goldLight,
        marginBottom: spacing.lg,
    },
    emptyTitle: {
        fontFamily: typography.fonts.sansMedium,
        fontSize: typography.sizes.xl,
        color: colors.charcoal,
        textAlign: "center",
        marginBottom: spacing.sm,
    },
    emptySub: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.md,
        color: colors.charcoalLight,
        textAlign: "center",
        lineHeight: typography.sizes.md * 1.6,
        marginBottom: spacing.xl,
    },
    browseBtn: {
        backgroundColor: colors.charcoal,
        borderRadius: radii.md,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
    },
    browseBtnText: {
        fontFamily: typography.fonts.sansMedium,
        fontSize: typography.sizes.md,
        color: colors.white,
    },

    // Checkout bar
    checkoutBar: {
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
    checkoutBarLabel: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.xs,
        color: colors.charcoalLight,
        letterSpacing: 0.3,
    },
    checkoutBarTotal: {
        fontFamily: typography.fonts.sansMedium,
        fontSize: typography.sizes.xl,
        color: colors.gold,
        marginTop: spacing.xxs,
    },
    checkoutBtn: {
        backgroundColor: colors.gold,
        borderRadius: radii.md,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
    },
    checkoutBtnText: {
        fontFamily: typography.fonts.sansMedium,
        fontSize: typography.sizes.md,
        color: colors.charcoal,
    },
});
