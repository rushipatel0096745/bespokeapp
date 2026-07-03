import React from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList, ActivityIndicator } from "react-native";

import { colors, radii, spacing, typography, componentStyles } from "@/theme/theme";
import ScreenWrapper from "@/components/layout/ScreenWrapper";
import NavBar from "../../components/layout/NavBar";
import { useCart, useUpdateCartItemQuantity, useRemoveCartItem } from "@/hooks/useCart";
import type { CartItem } from "@/types/Cart";

function formatPrice(value: number) {
    return `£${value.toFixed(2)}`;
}

// ─── Loading / error / empty states ────────────────────────────────────────────

function LoadingState() {
    return (
        <View style={styles.centered}>
            <ActivityIndicator size='large' color={colors.gold} />
        </View>
    );
}

function ErrorState() {
    return (
        <View style={styles.centered}>
            <Text style={styles.errorTitle}>Something went wrong</Text>
            <Text style={styles.errorBody}>We couldn't load your basket. Please try again.</Text>
        </View>
    );
}

function EmptyState({ onBrowse }: { onBrowse: () => void }) {
    return (
        <View style={styles.centered}>
            <Text style={styles.emptyTitle}>Your basket is empty</Text>
            <Text style={styles.emptyBody}>Add some products to get started.</Text>
            <TouchableOpacity style={componentStyles.buttonGold} onPress={onBrowse} activeOpacity={0.85}>
                <Text style={componentStyles.buttonGoldText}>Browse add-ons</Text>
            </TouchableOpacity>
        </View>
    );
}

// ─── Cart item row ──────────────────────────────────────────────────────────────

function CartItemRow({
    item,
    onIncrement,
    onDecrement,
    onRemove,
}: {
    item: CartItem;
    onIncrement: () => void;
    onDecrement: () => void;
    onRemove: () => void;
}) {
    return (
        <View style={styles.row}>
            {item.product?.image_url ? (
                <Image source={{ uri: item.product.image_url }} style={styles.image} resizeMode='cover' />
            ) : (
                <View style={[styles.image, styles.imagePlaceholder]} />
            )}

            <View style={styles.rowContent}>
                <Text style={styles.productName} numberOfLines={1}>
                    {item.product?.name ?? "Product"}
                </Text>

                {item.customizations.length > 0 && (
                    <Text style={styles.customizations} numberOfLines={2}>
                        {item.customizations.map((c) => `${c.field_label}: ${c.selected_value}`).join(" · ")}
                    </Text>
                )}

                <View style={styles.rowBottom}>
                    <View style={styles.stepperRow}>
                        <TouchableOpacity
                            style={styles.stepperBtn}
                            onPress={onDecrement}
                            activeOpacity={0.7}
                            hitSlop={8}>
                            <Text style={styles.stepperBtnText}>−</Text>
                        </TouchableOpacity>

                        <Text style={styles.stepperValue}>{item.quantity}</Text>

                        <TouchableOpacity
                            style={styles.stepperBtn}
                            onPress={onIncrement}
                            activeOpacity={0.7}
                            hitSlop={8}>
                            <Text style={styles.stepperBtnText}>+</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.lineTotal}>{formatPrice(item.line_total)}</Text>
                </View>
            </View>

            <TouchableOpacity onPress={onRemove} hitSlop={8} style={styles.removeBtn} activeOpacity={0.7}>
                <Text style={styles.removeBtnText}>Remove</Text>
            </TouchableOpacity>
        </View>
    );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function CartScreen() {
    const { orderId, conversationId } = useLocalSearchParams<{ orderId: string; conversationId?: string }>();
    // const orderId = "95851c09-8011-4424-bb4a-ff594c8431b4";

    const router = useRouter();

    const { data: cart, isLoading, isError } = useCart(orderId);
    const updateQuantity = useUpdateCartItemQuantity(orderId);
    const removeItem = useRemoveCartItem(orderId);

    return (
        <ScreenWrapper scrollable={false} header={<NavBar variant='back' title='Basket' />}>
            {isLoading && <LoadingState />}

            {!isLoading && isError && <ErrorState />}

            {!isLoading && !isError && cart && cart.items.length === 0 && <EmptyState onBrowse={() => router.back()} />}

            {!isLoading && !isError && cart && cart.items.length > 0 && (
                <View style={styles.screen}>
                    <FlatList
                        data={cart.items}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        renderItem={({ item }) => (
                            <CartItemRow
                                item={item}
                                onIncrement={() =>
                                    updateQuantity.mutate({ cartItemId: item.id, quantity: item.quantity + 1 })
                                }
                                onDecrement={() =>
                                    updateQuantity.mutate({ cartItemId: item.id, quantity: item.quantity - 1 })
                                }
                                onRemove={() => removeItem.mutate(item.id)}
                            />
                        )}
                    />

                    <View style={styles.footer}>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Total</Text>
                            <Text style={styles.totalValue}>{formatPrice(cart.total)}</Text>
                        </View>
                        <TouchableOpacity
                            style={componentStyles.buttonGold}
                            onPress={() =>
                                router.push({
                                    pathname: `/add-ons/${orderId}/checkout` as any,
                                    params: { conversationId },
                                })
                            }
                            activeOpacity={0.85}>
                            <Text style={componentStyles.buttonGoldText}>Proceed to checkout</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1 },
    centered: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.sm,
        paddingHorizontal: spacing.lg,
    },
    errorTitle: {
        fontFamily: typography.fonts.sansBold,
        fontSize: typography.sizes.xxl,
        color: colors.charcoal,
    },
    errorBody: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.md,
        color: colors.charcoalLight,
        textAlign: "center",
    },
    emptyTitle: {
        fontFamily: typography.fonts.sansBold,
        fontSize: typography.sizes.xxl,
        color: colors.charcoal,
    },
    emptyBody: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.md,
        color: colors.charcoalLight,
        textAlign: "center",
        marginBottom: spacing.md,
    },
    listContent: { padding: spacing.md, gap: spacing.md },
    row: {
        flexDirection: "row",
        gap: spacing.sm,
        paddingBottom: spacing.sm,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.border,
    },
    image: { width: 56, height: 56, borderRadius: radii.sm, backgroundColor: colors.border },
    imagePlaceholder: { alignItems: "center", justifyContent: "center" },
    rowContent: { flex: 1, gap: 4 },
    productName: {
        fontFamily: typography.fonts.sansMedium,
        fontSize: typography.sizes.md,
        color: colors.charcoal,
    },
    customizations: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.sm,
        color: colors.charcoalLight,
    },
    rowBottom: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 4,
    },
    stepperRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        borderWidth: 0.5,
        borderColor: colors.border,
        borderRadius: radii.sm,
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
    },
    stepperBtn: { paddingHorizontal: 4 },
    stepperBtnText: {
        fontFamily: typography.fonts.sansMedium,
        fontSize: typography.sizes.lg,
        color: colors.charcoal,
    },
    stepperValue: {
        fontFamily: typography.fonts.sansMedium,
        fontSize: typography.sizes.md,
        minWidth: 16,
        textAlign: "center",
        color: colors.charcoal,
    },
    lineTotal: {
        fontFamily: typography.fonts.sansBold,
        fontSize: typography.sizes.md,
        color: colors.charcoal,
    },
    removeBtn: { alignSelf: "flex-start" },
    removeBtnText: {
        fontFamily: typography.fonts.sansMedium,
        fontSize: typography.sizes.sm,
        color: colors.error,
    },
    footer: {
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: colors.border,
        padding: spacing.md,
        gap: spacing.sm,
    },
    totalRow: { flexDirection: "row", justifyContent: "space-between" },
    totalLabel: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.md,
        color: colors.charcoalLight,
    },
    totalValue: {
        fontFamily: typography.fonts.sansBold,
        fontSize: typography.sizes.xxl,
        color: colors.charcoal,
    },
});
