// components/AddonOrdersSection.tsx
import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { colors, typography, spacing, radii } from "@/theme/theme";
import { useAddonOrders, AddonOrder, AddonOrderItem } from "@/hooks/useAddonOrders";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(value: number) {
    return `£${value.toFixed(2)}`;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; background: string; dot: string }> = {
    pending: {
        label: "Pending",
        color: colors.charcoalMid,
        background: colors.creamMid,
        dot: colors.charcoalLight,
    },
    paid: {
        label: "Paid",
        color: colors.success,
        background: colors.successBg,
        dot: colors.success,
    },
    payment_failed: {
        label: "Payment failed",
        color: colors.error,
        background: colors.errorBg,
        dot: colors.error,
    },
    canceled: {
        label: "Cancelled",
        color: colors.charcoalLight,
        background: colors.creamMid,
        dot: colors.border,
    },
};

// ─── Status badge — matches the pattern from StatusBadge in order detail ──────

function AddonStatusBadge({ status }: { status: string }) {
    const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
    return (
        <View style={[badge.root, { backgroundColor: config.background }]}>
            <View style={[badge.dot, { backgroundColor: config.dot }]} />
            <Text style={[badge.label, { color: config.color }]}>{config.label}</Text>
        </View>
    );
}

const badge = StyleSheet.create({
    root: {
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
        paddingHorizontal: spacing.sm,
        paddingVertical: 3,
        borderRadius: radii.full,
        gap: spacing.xs,
    },
    dot: { width: 6, height: 6, borderRadius: 3 },
    label: {
        fontFamily: typography.fonts.sansMedium,
        fontSize: typography.sizes.xs,
        letterSpacing: typography.letterSpacing.wide,
    },
});

// ─── Single line item row ─────────────────────────────────────────────────────

function AddonItemRow({ item }: { item: AddonOrderItem }) {
    return (
        <View style={itemStyles.root}>
            <View style={itemStyles.header}>
                <Text style={itemStyles.name} numberOfLines={1}>
                    {item.product_name}
                    <Text style={itemStyles.qty}> ×{item.quantity}</Text>
                </Text>
                <Text style={itemStyles.price}>{formatPrice(item.line_total)}</Text>
            </View>

            {item.customizations.length > 0 && (
                <Text style={itemStyles.customizations} numberOfLines={2}>
                    {item.customizations.map((c) => `${c.field_label}: ${c.selected_value}`).join(" · ")}
                </Text>
            )}
        </View>
    );
}

const itemStyles = StyleSheet.create({
    root: {
        paddingVertical: spacing.sm,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.border,
        gap: 3,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: spacing.sm,
    },
    name: {
        flex: 1,
        fontFamily: typography.fonts.sansMedium,
        fontSize: typography.sizes.base,
        color: colors.charcoal,
    },
    qty: {
        fontFamily: typography.fonts.sans,
        color: colors.charcoalLight,
    },
    price: {
        fontFamily: typography.fonts.sansMedium,
        fontSize: typography.sizes.base,
        color: colors.charcoal,
    },
    customizations: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.xs,
        color: colors.charcoalLight,
        lineHeight: typography.sizes.xs * 1.6,
    },
});

// ─── Single addon order card ──────────────────────────────────────────────────

function AddonOrderCard({ addonOrder }: { addonOrder: AddonOrder }) {
    const [expanded, setExpanded] = useState(true);

    const date = new Date(addonOrder.created_at).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });

    return (
        <View style={card.root}>
            {/* Card header — tappable to collapse */}
            <Pressable
                style={({ pressed }) => [card.header, pressed && card.headerPressed]}
                onPress={() => setExpanded((v) => !v)}>
                <View style={card.headerLeft}>
                    <Text style={card.orderNumber}>{addonOrder.order_number}</Text>
                    <Text style={card.date}>{date}</Text>
                </View>
                <View style={card.headerRight}>
                    <AddonStatusBadge status={addonOrder.status} />
                    <Text style={card.chevron}>{expanded ? "▲" : "▼"}</Text>
                </View>
            </Pressable>

            {expanded && (
                <View style={card.body}>
                    {addonOrder.items.map((item) => (
                        <AddonItemRow key={item.id} item={item} />
                    ))}

                    {/* Totals */}
                    <View style={card.totals}>
                        {addonOrder.discount > 0 && (
                            <View style={card.totalRow}>
                                <Text style={card.totalLabel}>Discount</Text>
                                <Text style={card.discountValue}>−{formatPrice(addonOrder.discount)}</Text>
                            </View>
                        )}
                        <View style={card.totalRow}>
                            <Text style={card.totalLabelBold}>Total</Text>
                            <Text style={card.totalValue}>{formatPrice(addonOrder.total)}</Text>
                        </View>
                    </View>
                </View>
            )}
        </View>
    );
}

const card = StyleSheet.create({
    root: {
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.border,
        borderRadius: radii.md,
        backgroundColor: colors.white,
        overflow: "hidden",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: spacing.md,
        gap: spacing.sm,
        backgroundColor: colors.white,
    },
    headerPressed: {
        backgroundColor: colors.creamMid,
    },
    headerLeft: { gap: 2 },
    headerRight: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
    },
    orderNumber: {
        fontFamily: typography.fonts.sansMedium,
        fontSize: typography.sizes.base,
        color: colors.charcoal,
    },
    date: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.xs,
        color: colors.charcoalLight,
    },
    chevron: {
        fontSize: typography.sizes.xxs,
        color: colors.charcoalLight,
    },
    body: {
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.md,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: colors.border,
    },
    totals: {
        marginTop: spacing.sm,
        gap: spacing.xs,
    },
    totalRow: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    totalLabel: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.base,
        color: colors.charcoalLight,
    },
    totalLabelBold: {
        fontFamily: typography.fonts.sansMedium,
        fontSize: typography.sizes.base,
        color: colors.charcoal,
    },
    discountValue: {
        fontFamily: typography.fonts.sansMedium,
        fontSize: typography.sizes.base,
        color: colors.success,
    },
    totalValue: {
        fontFamily: typography.fonts.sansBold,
        fontSize: typography.sizes.lg,
        color: colors.charcoal,
    },
});

// ─── Section — drop this into OrderDetailContent ───────────────────────────────

export function AddonOrdersSection({ orderId }: { orderId: string }) {
    const { data: addonOrders, isLoading } = useAddonOrders(orderId);

    if (isLoading) return null; // section simply doesn't appear while loading

    if (!addonOrders || addonOrders.length === 0) return null;

    return (
        <>
            <View style={styles.divider} />
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Add-ons</Text>
                <View style={styles.cards}>
                    {addonOrders.map((addonOrder) => (
                        <AddonOrderCard key={addonOrder.id} addonOrder={addonOrder} />
                    ))}
                </View>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    divider: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: colors.border,
        marginHorizontal: spacing.lg,
    },
    section: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.lg,
        gap: spacing.sm,
    },
    sectionTitle: {
        fontFamily: typography.fonts.sansBold,
        fontSize: typography.sizes.md,
        color: colors.charcoal,
        letterSpacing: typography.letterSpacing.wide,
        textTransform: "uppercase",
        marginBottom: spacing.xs,
    },
    cards: {
        gap: spacing.sm,
    },
});
