import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useStripe } from "@stripe/stripe-react-native";

import { colors, radii, spacing, typography, componentStyles } from "@/theme/theme";
import ScreenWrapper from "@/components/layout/ScreenWrapper";
import NavBar from "@/components/layout/NavBar";
import { supabase } from "@/lib/supabase";
import { sendTextMessage } from "@/services/message";

// ─── Types ────────────────────────────────────────────────────────────────────

type AddonOrderItem = {
    id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    line_total: number;
};

type AddonOrder = {
    id: string;
    order_number: string;
    subtotal: number;
    discount: number;
    total: number;
    status: string;
    items: AddonOrderItem[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(value: number) {
    return `£${value.toFixed(2)}`;
}

// ─── States ───────────────────────────────────────────────────────────────────

function LoadingState({ message }: { message: string }) {
    return (
        <View style={styles.centered}>
            <ActivityIndicator size='large' color={colors.gold} />
            <Text style={styles.loadingText}>{message}</Text>
        </View>
    );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
    return (
        <View style={styles.centered}>
            <Text style={styles.errorTitle}>Something went wrong</Text>
            <Text style={styles.errorBody}>{message}</Text>
            <TouchableOpacity style={componentStyles.buttonGold} onPress={onRetry} activeOpacity={0.85}>
                <Text style={componentStyles.buttonGoldText}>Try again</Text>
            </TouchableOpacity>
        </View>
    );
}

function SuccessState({ orderNumber, onDone }: { orderNumber: string; onDone: () => void }) {
    return (
        <View style={styles.centered}>
            <Text style={styles.successIcon}>✓</Text>
            <Text style={styles.successTitle}>Payment successful</Text>
            <Text style={styles.successBody}>Your order {orderNumber} has been placed.</Text>
            <TouchableOpacity style={componentStyles.buttonGold} onPress={onDone} activeOpacity={0.85}>
                <Text style={componentStyles.buttonGoldText}>Done</Text>
            </TouchableOpacity>
        </View>
    );
}

// ─── Order summary ────────────────────────────────────────────────────────────

function OrderSummary({ order }: { order: AddonOrder }) {
    return (
        <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Order summary</Text>
            <Text style={styles.orderNumber}>{order.order_number}</Text>

            {order.items.map((item) => (
                <View key={item.id} style={styles.summaryRow}>
                    <Text style={styles.summaryItemName} numberOfLines={1}>
                        {item.product_name}
                        <Text style={styles.summaryItemQty}> ×{item.quantity}</Text>
                    </Text>
                    <Text style={styles.summaryItemTotal}>{formatPrice(item.line_total)}</Text>
                </View>
            ))}

            <View style={styles.summaryDivider} />

            {order.discount > 0 && (
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Discount</Text>
                    <Text style={styles.summaryDiscount}>−{formatPrice(order.discount)}</Text>
                </View>
            )}

            <View style={styles.summaryRow}>
                <Text style={styles.summaryTotalLabel}>Total</Text>
                <Text style={styles.summaryTotalValue}>{formatPrice(order.total)}</Text>
            </View>
        </View>
    );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

type ScreenState = "initializing" | "ready" | "paying" | "success" | "error";

export default function CheckoutScreen() {
    const { orderId, conversationId } = useLocalSearchParams<{ orderId: string; conversationId?: string }>();
    const router = useRouter();
    const { initPaymentSheet, presentPaymentSheet } = useStripe();

    const [screenState, setScreenState] = useState<ScreenState>("initializing");
    const [addonOrder, setAddonOrder] = useState<AddonOrder | null>(null);
    const [errorMessage, setErrorMessage] = useState<string>("");

    const initialize = useCallback(async () => {
        try {
            setScreenState("initializing");
            setErrorMessage("");

            // Step 1: snapshot cart into addon_order
            const { data: rpcData, error: rpcError } = await supabase.rpc("create_addon_order_from_cart", {
                p_order_id: orderId,
            });

            if (rpcError) throw new Error(rpcError.message);

            const order = rpcData as Omit<AddonOrder, "items">;

            // Step 2: fetch items for summary display
            const { data: items, error: itemsError } = await supabase
                .from("addon_order_items")
                .select("id, product_name, quantity, unit_price, line_total")
                .eq("addon_order_id", order.id);

            if (itemsError) throw new Error(itemsError.message);

            const fullOrder: AddonOrder = { ...order, items: items ?? [] };
            setAddonOrder(fullOrder);

            // Step 3: get Payment Sheet params from Edge Function
            const { data: sessionData } = await supabase.auth.getSession();
            const accessToken = sessionData.session?.access_token;

            const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/create-payment-intent`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                    apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
                },
                body: JSON.stringify({ addon_order_id: order.id }),
            });

            const json = await response.json();
            if (!response.ok) throw new Error(json.error ?? "Failed to create payment intent");

            // Step 4: initialise Payment Sheet
            const { error: initError } = await initPaymentSheet({
                merchantDisplayName: "Modern Mum Co",
                returnURL: "modernmum://stripe-redirect",
                customerId: json.customer,
                customerEphemeralKeySecret: json.ephemeralKey,
                paymentIntentClientSecret: json.paymentIntent,
                allowsDelayedPaymentMethods: false,
                defaultBillingDetails: { address: { country: "US" } },
                appearance: {
                    colors: {
                        primary: colors.gold,
                        background: colors.white,
                        componentBackground: colors.cream,
                        componentBorder: colors.border,
                        componentDivider: colors.border,
                        primaryText: colors.charcoal,
                        secondaryText: colors.charcoalLight,
                        componentText: colors.charcoal,
                        placeholderText: colors.charcoalLight,
                    },
                    shapes: {
                        borderRadius: radii.md,
                        borderWidth: 0.5,
                    },
                },
                googlePay: {
                    merchantCountryCode: "US",
                    testEnv: true, // set to false in production
                    currencyCode: "usd",
                },
                applePay: {
                    merchantCountryCode: "US",
                },
            });
            console.log("initPaymentSheet result:", JSON.stringify({ error: initError }));

            if (initError) throw new Error(initError.message);

            setScreenState("ready");
        } catch (err: any) {
            console.error("Checkout init error:", err);
            setErrorMessage(err.message ?? "Failed to initialise checkout");
            setScreenState("error");
        }
    }, [orderId]);

    useEffect(() => {
        initialize();
    }, [initialize]);

    async function handlePay() {
        if (screenState !== "ready") return;

        setScreenState("paying");

        const { error } = await presentPaymentSheet();

        if (error) {
            if (error.code === "Canceled") {
                // User dismissed the sheet — go back to ready
                setScreenState("ready");
                return;
            }
            setErrorMessage(error.message ?? "Payment failed");
            setScreenState("error");
            return;
        }

        // Payment succeeded — webhook will update order status
        setScreenState("success");
    }

    // ── Loading ───────────────────────────────────────────────────────────────

    if (screenState === "initializing") {
        return (
            <ScreenWrapper scrollable={false} header={<NavBar variant='back' title='Checkout' />}>
                <LoadingState message='Preparing your order...' />
            </ScreenWrapper>
        );
    }

    if (screenState === "error") {
        return (
            <ScreenWrapper scrollable={false} header={<NavBar variant='back' title='Checkout' />}>
                <ErrorState message={errorMessage} onRetry={initialize} />
            </ScreenWrapper>
        );
    }

    if (screenState === "success" && addonOrder) {
        return (
            <ScreenWrapper scrollable={false} header={<NavBar variant='back' title='Checkout' />}>
                <SuccessState
                    orderNumber={addonOrder.order_number}
                    onDone={async () => {
                        if (conversationId) {
                            // await sendText(`Add-on order placed! Order ID: ${addonOrder.order_number}`);
                            await sendTextMessage(
                                conversationId,
                                `Add-on order placed! Order ID: ${addonOrder.order_number}`
                            );
                            await supabase.rpc("confirm_addon_order", {
                                p_conversation_id: conversationId,
                                p_addon_order_id: addonOrder.id,
                            });
                        }
                        // this is something that i have never encountered in my life but now i totally depends on this thing which pretty much amazing if you think about it if you carefully see through
                        router.dismissAll();
                        router.replace("/orders");
                        router.push(`/orders/${orderId}/chat`);
                        // router.push(`/orders/${orderId}`);
                    }}
                />
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper scrollable={false} header={<NavBar variant='back' title='Checkout' />}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {addonOrder && <OrderSummary order={addonOrder} />}

                <View style={styles.paymentSection}>
                    <Text style={styles.paymentTitle}>Payment</Text>
                    <Text style={styles.paymentSubtitle}>
                        Apple Pay, Google Pay, and cards accepted. Your payment is handled securely by Stripe.
                    </Text>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[componentStyles.buttonGold, screenState === "paying" && styles.buttonDisabled]}
                    onPress={handlePay}
                    disabled={screenState === "paying"}
                    activeOpacity={0.85}>
                    {screenState === "paying" ? (
                        <ActivityIndicator color={colors.charcoal} />
                    ) : (
                        <Text style={componentStyles.buttonGoldText}>
                            Pay {addonOrder ? formatPrice(addonOrder.total) : ""}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        </ScreenWrapper>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    centered: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.md,
        paddingHorizontal: spacing.lg,
    },
    loadingText: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.md,
        color: colors.charcoalLight,
        marginTop: spacing.sm,
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
        marginBottom: spacing.sm,
    },
    successIcon: {
        fontSize: 48,
        color: colors.gold,
    },
    successTitle: {
        fontFamily: typography.fonts.sansBold,
        fontSize: typography.sizes.xxl,
        color: colors.charcoal,
    },
    successBody: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.md,
        color: colors.charcoalLight,
        textAlign: "center",
        marginBottom: spacing.sm,
    },
    scrollContent: {
        padding: spacing.lg,
        gap: spacing.lg,
        paddingBottom: spacing.xxxl,
    },
    summaryCard: {
        ...componentStyles.card,
        gap: spacing.sm,
    },
    summaryTitle: {
        fontFamily: typography.fonts.sansMedium,
        fontSize: typography.sizes.sm,
        color: colors.charcoalLight,
        letterSpacing: typography.letterSpacing.wide,
        textTransform: "uppercase",
        marginBottom: spacing.xs,
    },
    orderNumber: {
        fontFamily: typography.fonts.sansMedium,
        fontSize: typography.sizes.base,
        color: colors.charcoalLight,
        marginBottom: spacing.xs,
    },
    summaryRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    summaryItemName: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.md,
        color: colors.charcoal,
        flex: 1,
    },
    summaryItemQty: {
        color: colors.charcoalLight,
    },
    summaryItemTotal: {
        fontFamily: typography.fonts.sansMedium,
        fontSize: typography.sizes.md,
        color: colors.charcoal,
    },
    summaryDivider: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: colors.border,
        marginVertical: spacing.xs,
    },
    summaryLabel: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.md,
        color: colors.charcoalLight,
    },
    summaryDiscount: {
        fontFamily: typography.fonts.sansMedium,
        fontSize: typography.sizes.md,
        color: colors.success,
    },
    summaryTotalLabel: {
        fontFamily: typography.fonts.sansMedium,
        fontSize: typography.sizes.md,
        color: colors.charcoal,
    },
    summaryTotalValue: {
        fontFamily: typography.fonts.sansBold,
        fontSize: typography.sizes.xl,
        color: colors.charcoal,
    },
    paymentSection: {
        gap: spacing.xs,
    },
    paymentTitle: {
        fontFamily: typography.fonts.sansMedium,
        fontSize: typography.sizes.lg,
        color: colors.charcoal,
    },
    paymentSubtitle: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.sm,
        color: colors.charcoalLight,
        lineHeight: typography.sizes.sm * 1.6,
    },
    footer: {
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: colors.border,
        padding: spacing.lg,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
});
