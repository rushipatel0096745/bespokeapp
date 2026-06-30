import React from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    ScrollView,
    TextInput,
    ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { colors, radii, spacing, typography, componentStyles } from "@/theme/theme";
import ScreenWrapper from "@/components/layout/ScreenWrapper";
import NavBar from "../../components/layout/NavBar";
import { useProductDetail } from "@/hooks/useProduct";
import { useProductForm, ProductField, FieldOption } from "@/hooks/useProductForm";
import { useCart, useAddToCart } from "@/hooks/useCart";
import { useToast } from "@/components/layout/Toast";

// ─── Colour-style field keys ───────────────────────────────────────────────────
// Fields whose options should render as colour swatches rather than pills.
// Extend this list as more colour-type fields appear (e.g. card_colour).
const COLOUR_FIELD_KEYS = new Set(["foil_colour", "frame_colour", "card_colour"]);

// Rough label → hex map for known option values, since options don't carry hex.
// Falls back to a neutral swatch if not found.
const COLOUR_HEX: Record<string, string> = {
    gold: "#C9A84C",
    silver: "#C7C9CC",
    rose_gold: "#E0B7AC",
    white: "#FFFFFF",
    black: "#1C1A17",
    oak: "#B6895A",
};

// ─── Basket button ──────────────────────────────────────────────────────────────

function BasketButton({ basketCount, onPress }: { basketCount: number; onPress: () => void }) {
    return (
        <TouchableOpacity
            style={styles.basketBtn}
            onPress={onPress}
            accessibilityRole='button'
            accessibilityLabel={`Basket, ${basketCount} items`}>
            <Text style={styles.basketIcon}>🛒</Text>
            {basketCount > 0 && (
                <View style={styles.basketBadge}>
                    <Text style={styles.basketBadgeText}>{basketCount}</Text>
                </View>
            )}
        </TouchableOpacity>
    );
}

// ─── Shared bits ───────────────────────────────────────────────────────────────

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
    return (
        <Text style={styles.fieldLabel}>
            {label}
            {required && <Text style={styles.requiredMark}> *</Text>}
        </Text>
    );
}

function FieldError({ message }: { message?: string }) {
    if (!message) return null;
    return <Text style={styles.fieldError}>{message}</Text>;
}

// Pill-style select (for non-colour fields like print_type)
function PillField({
    field,
    value,
    onChange,
    error,
}: {
    field: ProductField;
    value: string | undefined;
    onChange: (v: string) => void;
    error?: string;
}) {
    const options = [...field.options].sort((a, b) => a.display_order - b.display_order);

    return (
        <View style={styles.fieldGroup}>
            <FieldLabel label={field.label} required={field.required} />
            <View style={styles.pillRow}>
                {options.map((opt) => {
                    const active = value === opt.value;
                    return (
                        <TouchableOpacity
                            key={opt.id}
                            style={[styles.pill, active && styles.pillActive]}
                            onPress={() => onChange(opt.value)}
                            activeOpacity={0.7}>
                            <Text style={[styles.pillText, active && styles.pillTextActive]}>{opt.label}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
            <FieldError message={error} />
        </View>
    );
}

// Swatch-style select (for colour fields)
function SwatchField({
    field,
    value,
    onChange,
    error,
}: {
    field: ProductField;
    value: string | undefined;
    onChange: (v: string) => void;
    error?: string;
}) {
    const options = [...field.options].sort((a, b) => a.display_order - b.display_order);

    return (
        <View style={styles.fieldGroup}>
            <FieldLabel label={field.label} required={field.required} />
            <View style={styles.swatchRow}>
                {options.map((opt) => {
                    const active = value === opt.value;
                    const hex = COLOUR_HEX[opt.value] ?? colors.border;
                    return (
                        <TouchableOpacity
                            key={opt.id}
                            style={styles.swatchItem}
                            onPress={() => onChange(opt.value)}
                            activeOpacity={0.75}>
                            <View style={[styles.swatch, { backgroundColor: hex }, active && styles.swatchActive]} />
                            <Text style={[styles.swatchLabel, active && styles.swatchLabelActive]} numberOfLines={1}>
                                {opt.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
            <FieldError message={error} />
        </View>
    );
}

// Textarea field
function TextAreaField({
    field,
    value,
    onChange,
    error,
}: {
    field: ProductField;
    value: string | undefined;
    onChange: (v: string) => void;
    error?: string;
}) {
    return (
        <View style={styles.fieldGroup}>
            <FieldLabel label={field.label} required={field.required} />
            <TextInput
                style={styles.textArea}
                placeholder={field.placeholder ?? undefined}
                placeholderTextColor={colors.charcoalLight}
                value={value ?? ""}
                onChangeText={onChange}
                multiline
                numberOfLines={4}
                maxLength={field.max_length ?? undefined}
            />
            <FieldError message={error} />
        </View>
    );
}

// Routes each field to the right renderer based on field_type / field_key
function DynamicField({
    field,
    value,
    onChange,
    error,
}: {
    field: ProductField;
    value: string | undefined;
    onChange: (v: string) => void;
    error?: string;
}) {
    if (field.field_type === "textarea") {
        return <TextAreaField field={field} value={value} onChange={onChange} error={error} />;
    }

    if (field.field_type === "select") {
        if (COLOUR_FIELD_KEYS.has(field.field_key)) {
            return <SwatchField field={field} value={value} onChange={onChange} error={error} />;
        }
        return <PillField field={field} value={value} onChange={onChange} error={error} />;
    }

    // Fallback for plain "text" or unknown types
    return (
        <View style={styles.fieldGroup}>
            <FieldLabel label={field.label} required={field.required} />
            <TextInput
                style={styles.textInput}
                placeholder={field.placeholder ?? undefined}
                placeholderTextColor={colors.charcoalLight}
                value={value ?? ""}
                onChangeText={onChange}
                maxLength={field.max_length ?? undefined}
            />
            <FieldError message={error} />
        </View>
    );
}

// Quantity stepper
function QuantityStepper({
    quantity,
    onIncrement,
    onDecrement,
    min,
    max,
}: {
    quantity: number;
    onIncrement: () => void;
    onDecrement: () => void;
    min: number;
    max: number;
}) {
    return (
        <View style={styles.fieldGroup}>
            <FieldLabel label='Quantity' />
            <View style={styles.stepperRow}>
                <TouchableOpacity
                    style={[styles.stepperBtn, quantity <= min && styles.stepperBtnDisabled]}
                    onPress={onDecrement}
                    disabled={quantity <= min}
                    activeOpacity={0.7}>
                    <Text style={styles.stepperBtnText}>−</Text>
                </TouchableOpacity>

                <Text style={styles.stepperValue}>{quantity}</Text>

                <TouchableOpacity
                    style={[styles.stepperBtn, quantity >= max && styles.stepperBtnDisabled]}
                    onPress={onIncrement}
                    disabled={quantity >= max}
                    activeOpacity={0.7}>
                    <Text style={styles.stepperBtnText}>+</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

// ─── Loading / error states ────────────────────────────────────────────────────

function LoadingState() {
    return (
        <View style={styles.centered}>
            <ActivityIndicator size='large' color={colors.gold} />
        </View>
    );
}

function ErrorState({ message }: { message: string }) {
    return (
        <View style={styles.centered}>
            <Text style={styles.errorTitle}>Something went wrong</Text>
            <Text style={styles.errorBody}>{message}</Text>
        </View>
    );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

const ProductDetails = () => {
    const { productSlug } = useLocalSearchParams<{ productSlug: string }>();
    const orderId = "95851c09-8011-4424-bb4a-ff594c8431b4";

    const router = useRouter();
    const { showToast } = useToast();

    const { product, fields, isLoading, error } = useProductDetail(productSlug);

    const {
        sortedFields,
        values,
        errors,
        setValue,
        validate,
        quantity,
        incrementQuantity,
        decrementQuantity,
        minQuantity,
        maxQuantity,
    } = useProductForm(fields);

    // Shared cache entry with the listing + cart screens — cheap if already fetched.
    const { data: cart } = useCart(orderId);
    const addToCart = useAddToCart(orderId);

    console.log("orderId param:", orderId, "cart loaded:", !!cart, "isPending:", addToCart.isPending);

    const basketCount = cart?.items.reduce((sum, i) => sum + i.quantity, 0) ?? 0;
    const totalPrice = (product?.price ?? 0) * quantity;

    function handleAddToBasket() {
        console.log("handleAddToBasket called");
        console.log("validate result:", validate());
        console.log("product:", product?.id, "cart:", cart?.id);

        if (!validate()) {
            console.log("validation failed, errors:", errors);
            return;
        }
        if (!product || !cart) {
            console.log("missing product or cart, bailing out");
            return;
        }

        // Rebuild field_label alongside each selected value — `values` only
        // stores field_key -> value, so look the label up from sortedFields.
        const customizations = sortedFields
            .filter((field) => values[field.field_key] !== undefined)
            .map((field) => ({
                field_key: field.field_key,
                field_label: field.label,
                selected_value: values[field.field_key],
            }));

        addToCart.mutate(
            {
                cartId: cart.id,
                productId: product.id,
                quantity,
                unitPrice: product.price,
                customizations,
            },
            {
                onSuccess: () => {
                    console.log("add to cart succeeded");
                    showToast("Added to basket");
                },
                onError: (err) => {
                    console.log("add to cart failed:", err);
                    showToast("Couldn't add to basket, please try again", "error");
                },
            }
        );
    }

    return (
        <ScreenWrapper
            scrollable={false}
            header={
                <NavBar
                    variant='back'
                    title={product?.name ?? "Product details"}
                    rightElement={
                        <BasketButton basketCount={basketCount} onPress={() => router.push(`/add-ons/cart`)} />
                    }
                />
            }>
            {isLoading && <LoadingState />}

            {!isLoading && error && <ErrorState message="We couldn't load this product. Please try again." />}

            {!isLoading && !error && product && (
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {/* Product image */}
                    {product.image_url ? (
                        <Image source={{ uri: product.image_url }} style={styles.heroImage} resizeMode='cover' />
                    ) : (
                        <View style={[styles.heroImage, styles.heroImageFallback]}>
                            <Text style={styles.heroImageFallbackText}>No image available</Text>
                        </View>
                    )}

                    <View style={styles.body}>
                        {/* Name + price */}
                        <View style={styles.titleRow}>
                            <Text style={styles.productName}>{product.name}</Text>
                            <Text style={styles.productPrice}>£{totalPrice.toFixed(2)}</Text>
                        </View>

                        {product.description && <Text style={styles.productDescription}>{product.description}</Text>}

                        {/* Dynamic fields */}
                        {sortedFields.length > 0 && (
                            <View style={styles.fieldsSection}>
                                {sortedFields.map((field) => (
                                    <DynamicField
                                        key={field.id}
                                        field={field}
                                        value={values[field.field_key]}
                                        onChange={(v) => setValue(field.field_key, v)}
                                        error={errors[field.field_key]}
                                    />
                                ))}
                            </View>
                        )}

                        {/* Quantity */}
                        <QuantityStepper
                            quantity={quantity}
                            onIncrement={incrementQuantity}
                            onDecrement={decrementQuantity}
                            min={minQuantity}
                            max={maxQuantity}
                        />

                        {/* Add to basket */}
                        <TouchableOpacity
                            style={[
                                componentStyles.buttonGold,
                                (!cart || addToCart.isPending) && styles.buttonDisabled,
                            ]}
                            onPress={handleAddToBasket}
                            disabled={!cart || addToCart.isPending}
                            activeOpacity={0.85}>
                            <Text style={componentStyles.buttonGoldText}>
                                {addToCart.isPending ? "Adding..." : "Add to basket"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            )}
        </ScreenWrapper>
    );
};

export default ProductDetails;

const styles = StyleSheet.create({
    basketBtn: {
        position: "relative",
        padding: spacing.xs,
    },
    basketIcon: {
        fontSize: typography.sizes.xl,
    },
    basketBadge: {
        position: "absolute",
        top: -2,
        right: -2,
        backgroundColor: colors.gold,
        borderRadius: radii.full,
        minWidth: 16,
        height: 16,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 3,
    },
    basketBadgeText: {
        fontFamily: typography.fonts.sansBold,
        fontSize: typography.sizes.xxs,
        color: colors.white,
    },
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
    scrollContent: {
        paddingBottom: spacing.xxxl,
    },
    heroImage: {
        width: "100%",
        height: 280,
        backgroundColor: colors.creamMid,
    },
    heroImageFallback: {
        alignItems: "center",
        justifyContent: "center",
    },
    heroImageFallbackText: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.sm,
        color: colors.charcoalLight,
    },
    body: {
        padding: spacing.lg,
        gap: spacing.lg,
    },
    titleRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: spacing.md,
    },
    productName: {
        flex: 1,
        fontFamily: typography.fonts.sansBold,
        fontSize: typography.sizes.xxl,
        color: colors.charcoal,
    },
    productPrice: {
        fontFamily: typography.fonts.sansBold,
        fontSize: typography.sizes.xl,
        color: colors.gold,
    },
    productDescription: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.md,
        color: colors.charcoalLight,
        lineHeight: typography.sizes.md * typography.lineHeights.normal,
    },
    fieldsSection: {
        gap: spacing.lg,
    },
    fieldGroup: {
        gap: spacing.sm,
    },
    fieldLabel: {
        fontFamily: typography.fonts.sansMedium,
        fontSize: typography.sizes.sm,
        color: colors.charcoalMid,
    },
    requiredMark: {
        color: colors.error,
    },
    fieldError: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.xs,
        color: colors.error,
    },
    pillRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: spacing.sm,
    },
    pill: {
        borderWidth: 0.5,
        borderColor: colors.border,
        borderRadius: radii.full,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        backgroundColor: colors.white,
    },
    pillActive: {
        borderColor: colors.gold,
        backgroundColor: colors.goldPale,
    },
    pillText: {
        fontFamily: typography.fonts.sansMedium,
        fontSize: typography.sizes.base,
        color: colors.charcoalMid,
    },
    pillTextActive: {
        color: colors.charcoal,
    },
    swatchRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: spacing.md,
    },
    swatchItem: {
        alignItems: "center",
        gap: spacing.xs,
        width: 56,
    },
    swatch: {
        width: 36,
        height: 36,
        borderRadius: radii.full,
        borderWidth: 1,
        borderColor: colors.border,
    },
    swatchActive: {
        borderWidth: 2,
        borderColor: colors.gold,
    },
    swatchLabel: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.xxs,
        color: colors.charcoalLight,
        textAlign: "center",
    },
    swatchLabelActive: {
        fontFamily: typography.fonts.sansMedium,
        color: colors.charcoal,
    },
    textArea: {
        borderWidth: 0.5,
        borderColor: colors.border,
        borderRadius: radii.sm,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.md,
        color: colors.charcoalMid,
        backgroundColor: colors.white,
        minHeight: 90,
        textAlignVertical: "top",
    },
    textInput: {
        borderWidth: 0.5,
        borderColor: colors.border,
        borderRadius: radii.sm,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.md,
        color: colors.charcoalMid,
        backgroundColor: colors.white,
    },
    stepperRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
    },
    stepperBtn: {
        width: 32,
        height: 32,
        borderRadius: radii.full,
        borderWidth: 0.5,
        borderColor: colors.border,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.white,
    },
    stepperBtnDisabled: {
        opacity: 0.4,
    },
    stepperBtnText: {
        fontFamily: typography.fonts.sansMedium,
        fontSize: typography.sizes.lg,
        color: colors.charcoal,
    },
    stepperValue: {
        fontFamily: typography.fonts.sansMedium,
        fontSize: typography.sizes.md,
        color: colors.charcoal,
        minWidth: 20,
        textAlign: "center",
    },
    buttonDisabled: {
        opacity: 0.5,
    },
});
