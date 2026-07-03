import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { CardField, useStripe, CardFieldInput } from "@stripe/stripe-react-native";

import { colors, radii, spacing, typography, componentStyles } from "@/theme/theme";
import ScreenWrapper from "@/components/layout/ScreenWrapper";
import NavBar from "@/components/layout/NavBar";
import { supabase } from "@/lib/supabase";
import { useSendMessage } from "@/hooks/useSendMessage";
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
    const { orderId, conversationId } = useLocalSearchParams<{ orderId: string; conversationId: string }>();
    const router = useRouter();
    const { confirmPayment } = useStripe();

    const { sendText, sendImage, isSending } = useSendMessage(conversationId ?? "");

    const [screenState, setScreenState] = useState<ScreenState>("initializing");
    const [addonOrder, setAddonOrder] = useState<AddonOrder | null>(null);
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [cardDetails, setCardDetails] = useState<CardFieldInput.Details | null>(null);
    const [errorMessage, setErrorMessage] = useState<string>("");

    const initialize = useCallback(async () => {
        try {
            setScreenState("initializing");
            setErrorMessage("");

            // Step 1: snapshot the cart into an addon_order
            const { data: rpcData, error: rpcError } = await supabase.rpc("create_addon_order_from_cart", {
                p_order_id: orderId,
            });

            if (rpcError) throw new Error(rpcError.message);

            const order = rpcData as Omit<AddonOrder, "items">;

            // Step 2: fetch the order items to display in the summary
            const { data: items, error: itemsError } = await supabase
                .from("addon_order_items")
                .select("id, product_name, quantity, unit_price, line_total")
                .eq("addon_order_id", order.id);

            if (itemsError) throw new Error(itemsError.message);

            const fullOrder: AddonOrder = { ...order, items: items ?? [] };
            setAddonOrder(fullOrder);

            // Step 3: create a PaymentIntent via Edge Function
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

            setClientSecret(json.client_secret);
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
        if (!clientSecret || !cardDetails?.complete) return;

        try {
            setScreenState("paying");

            const { error: stripeError } = await confirmPayment(clientSecret, {
                paymentMethodType: "Card",
                paymentMethodData: { billingDetails: {} },
            });

            if (stripeError) {
                // User-facing Stripe errors (card declined, insufficient funds, etc.)
                // are safe to show directly — Stripe's error messages are already
                // user-friendly and don't expose internals.
                setErrorMessage(stripeError.message ?? "Payment failed");
                setScreenState("error");
                return;
            }

            // Note: don't rely on this callback alone for order fulfillment.
            // The stripe-webhook Edge Function is the source of truth and will
            // update addon_orders.status to 'paid' independently of this.
            setScreenState("success");
        } catch (err: any) {
            console.error("Payment error:", err);
            setErrorMessage(err.message ?? "Payment failed");
            setScreenState("error");
        }
    }

    const isCardComplete = cardDetails?.complete ?? false;
    const isPaying = screenState === "paying";

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

    // if (screenState === "success" && addonOrder) {
    //     return (
    //         <ScreenWrapper scrollable={false} header={<NavBar variant='back' title='Checkout' />}>
    //             <SuccessState
    //                 orderNumber={addonOrder.order_number}
    //                 // onDone={() => router.replace(`/orders/${orderId}`)}
    //                 onDone={() => {
    //                     router.dismissAll();
    //                     router.replace("/orders");
    //                     router.push(`/orders/${orderId}`);
    //                 }}
    //             />
    //         </ScreenWrapper>
    //     );
    // }

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
                    <Text style={styles.paymentTitle}>Payment details</Text>
                    <Text style={styles.paymentSubtitle}>Your card details are handled securely by Stripe.</Text>

                    <CardField
                        postalCodeEnabled={false}
                        style={styles.cardField}
                        cardStyle={{
                            backgroundColor: colors.white,
                            textColor: colors.charcoal,
                            placeholderColor: colors.charcoalLight,
                            borderColor: colors.border,
                            borderWidth: 0.5,
                            borderRadius: radii.sm,
                        }}
                        onCardChange={(details) => setCardDetails(details)}
                    />
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[componentStyles.buttonGold, (!isCardComplete || isPaying) && styles.buttonDisabled]}
                    onPress={handlePay}
                    disabled={!isCardComplete || isPaying}
                    activeOpacity={0.85}>
                    {isPaying ? (
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
        gap: spacing.sm,
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
    },
    cardField: {
        height: 50,
        marginTop: spacing.xs,
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
