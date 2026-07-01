// app/(tabs)/add-ons/index.tsx
// Modern Mum Co — Add-ons Listing Screen
// Uses useProducts() hook (TanStack Query) — matches hook pattern provided

import React, { useState, useCallback } from "react";
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    Image,
    RefreshControl,
    TextInput,
    Pressable,
    Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useProducts } from "@/hooks/useProduct";
import { useBasket } from "@/hooks/useBasket";
import { Product } from "@/types/Product";
import { colors, typography, spacing, radii, shadows } from "@/theme/theme";
import ScreenWrapper from "@/components/layout/ScreenWrapper";
import NavBar from "@/components/layout/NavBar";
import { CartSummaryBar } from "@/components/layout/CartSummaryBar";

// ─── Types ────────────────────────────────────────────────────────────────────

type SortKey = "default" | "price_asc" | "price_desc";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatPrice = (pence: number) => `£${(pence / 100).toFixed(2)}`;

function groupByCategory(products: Product[]): { category: string; data: Product[] }[] {
    const map = new Map<string, Product[]>();
    products.forEach((p) => {
        if (!map.has(p.category)) map.set(p.category, []);
        map.get(p.category)!.push(p);
    });
    return Array.from(map.entries())
        .map(([category, data]) => ({ category, data }))
        .sort((a, b) => a.category.localeCompare(b.category));
}

function sortProducts(products: Product[], sort: SortKey): Product[] {
    if (sort === "price_asc") return [...products].sort((a, b) => a.price - b.price);
    if (sort === "price_desc") return [...products].sort((a, b) => b.price - a.price);
    return [...products].sort((a, b) => a.display_order - b.display_order);
}

function filterProducts(products: Product[], query: string): Product[] {
    if (!query.trim()) return products;
    const q = query.toLowerCase();
    return products.filter(
        (p) =>
            p.name.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q) ||
            (p.description ?? "").toLowerCase().includes(q)
    );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function NavBar1({ basketCount }: { basketCount: number }) {
    const router = useRouter();
    return (
        <View style={styles.navBar}>
            <View>
                <Text style={styles.navLogo}>Modern Mum Co®</Text>
                <Text style={styles.navSub}>Add-ons</Text>
            </View>
            <TouchableOpacity
                style={styles.basketBtn}
                onPress={() => router.push("/add-ons/basket")}
                accessibilityRole='button'
                accessibilityLabel={`Basket, ${basketCount} items`}>
                <Text style={styles.basketIcon}>🛒</Text>
                {basketCount > 0 && (
                    <View style={styles.basketBadge}>
                        <Text style={styles.basketBadgeText}>{basketCount}</Text>
                    </View>
                )}
            </TouchableOpacity>
        </View>
    );
}

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

function PromoBanner() {
    return (
        <View style={styles.promoBanner}>
            <Text style={styles.promoText}>Spend £40 or more and get 20% off!</Text>
        </View>
    );
}

function SearchBar({ value, onChangeText }: { value: string; onChangeText: (t: string) => void }) {
    return (
        <View style={styles.searchRow}>
            <View style={styles.searchInputWrap}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                    style={styles.searchInput}
                    value={value}
                    onChangeText={onChangeText}
                    placeholder='Search add-ons...'
                    placeholderTextColor={colors.charcoalLight}
                    returnKeyType='search'
                    clearButtonMode='while-editing'
                    accessibilityLabel='Search add-ons'
                />
                {value.length > 0 && (
                    <TouchableOpacity onPress={() => onChangeText("")} accessibilityLabel='Clear search'>
                        <Text style={styles.clearBtn}>✕</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

function SortBar({ active, onChange }: { active: SortKey; onChange: (k: SortKey) => void }) {
    const options: { key: SortKey; label: string }[] = [
        { key: "default", label: "Featured" },
        { key: "price_asc", label: "Price ↑" },
        { key: "price_desc", label: "Price ↓" },
    ];
    return (
        <View style={styles.sortBar}>
            {options.map((o) => (
                <TouchableOpacity
                    key={o.key}
                    style={[styles.sortChip, active === o.key && styles.sortChipActive]}
                    onPress={() => onChange(o.key)}
                    accessibilityRole='radio'
                    accessibilityState={{ checked: active === o.key }}>
                    <Text style={[styles.sortChipText, active === o.key && styles.sortChipTextActive]}>{o.label}</Text>
                </TouchableOpacity>
            ))}
        </View>
    );
}

function CategoryHeader({ title }: { title: string }) {
    return (
        <View style={styles.categoryHeader}>
            <Text style={styles.categoryTitle}>{title}</Text>
            <View style={styles.categoryLine} />
        </View>
    );
}

function ProductCard({
    product,
    inBasket,
    onPress,
    onAddToBasket,
}: {
    product: Product;
    inBasket: boolean;
    onPress: () => void;
    onAddToBasket: () => void;
}) {
    return (
        <TouchableOpacity
            style={styles.card}
            onPress={onPress}
            activeOpacity={0.85}
            accessibilityRole='button'
            accessibilityLabel={`${product.name}, ${formatPrice(product.price)}`}>
            {/* Product image */}
            <View style={styles.cardImageWrap}>
                {product.image_url ? (
                    <Image
                        source={{ uri: product.image_url }}
                        style={styles.cardImage}
                        resizeMode='cover'
                        accessibilityLabel={product.name}
                    />
                ) : (
                    <View style={styles.cardImagePlaceholder}>
                        <Text style={styles.cardImagePlaceholderText}>✦</Text>
                    </View>
                )}
                {inBasket && (
                    <View style={styles.inBasketBadge}>
                        <Text style={styles.inBasketText}>In basket</Text>
                    </View>
                )}
            </View>

            {/* Product info */}
            <View style={styles.cardBody}>
                <Text style={styles.cardCategory}>{product.category}</Text>
                <Text style={styles.cardName} numberOfLines={2}>
                    {product.name}
                </Text>
                {product.description && (
                    <Text style={styles.cardDescription} numberOfLines={2}>
                        {product.description}
                    </Text>
                )}

                <View style={styles.cardFooter}>
                    <Text style={styles.cardPrice}>{formatPrice(product.price)}</Text>
                    <TouchableOpacity
                        style={[styles.addBtn, inBasket && styles.addBtnAdded]}
                        onPress={(e) => {
                            e.stopPropagation?.();
                            onAddToBasket();
                        }}
                        activeOpacity={0.8}
                        accessibilityRole='button'
                        accessibilityLabel={inBasket ? "Added to basket" : `Add ${product.name} to basket`}>
                        <Text style={[styles.addBtnText, inBasket && styles.addBtnTextAdded]}>
                            {inBasket ? "✓ Added" : "+ Add"}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );
}

function ProductCardSkeleton() {
    return (
        <View style={[styles.card, styles.skeletonCard]}>
            <View style={styles.skeletonImage} />
            <View style={styles.cardBody}>
                <View style={styles.skeletonLine} />
                <View style={[styles.skeletonLine, { width: "70%", marginTop: spacing.xs }]} />
                <View style={[styles.skeletonLine, { width: "50%", marginTop: spacing.sm }]} />
            </View>
        </View>
    );
}

function EmptyState({ query }: { query: string }) {
    return (
        <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>✦</Text>
            <Text style={styles.emptyTitle}>{query ? `No results for "${query}"` : "No add-ons available"}</Text>
            <Text style={styles.emptySubtitle}>
                {query
                    ? "Try a different search term or browse all products."
                    : "Check back soon — new extras are added regularly."}
            </Text>
        </View>
    );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
    return (
        <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>!</Text>
            <Text style={styles.emptyTitle}>Couldn't load add-ons</Text>
            <Text style={styles.emptySubtitle}>Check your connection and try again.</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={onRetry} accessibilityRole='button'>
                <Text style={styles.retryBtnText}>Try again</Text>
            </TouchableOpacity>
        </View>
    );
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

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AddOnsScreen() {
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [sort, setSort] = useState<SortKey>("default");

    // HARDCODED TEMPORARY
    // const orderId = "95851c09-8011-4424-bb4a-ff594c8431b4";

    const { orderId } = useLocalSearchParams<{ orderId: string }>();

    // ── Data ──────────────────────────────────────────────────────────────────
    const { data: products, isLoading, isError, refetch, isRefetching } = useProducts();
    const { items: basketItems, addItem, total: basketTotal } = useBasket();

    const basketCount = basketItems.reduce((sum, i) => sum + i.quantity, 0);
    // const basketCount = 0;

    const isInBasket = useCallback(
        (productId: string) => basketItems.some((i: any) => i.productId === productId),
        [basketItems]
    );

    // ── Derived list ──────────────────────────────────────────────────────────
    const activeProducts = (products ?? []).filter((p) => p.is_active);
    const filtered = filterProducts(activeProducts, search);
    const sorted = sortProducts(filtered, sort);
    const grouped = groupByCategory(sorted);

    // ── Flat list data ────────────────────────────────────────────────────────
    type ListItem =
        | { type: "header"; category: string; key: string }
        | { type: "product"; product: Product; key: string };

    const listData: ListItem[] = grouped.flatMap((group) => [
        { type: "header", category: group.category, key: `header-${group.category}` },
        ...group.data.map((p) => ({ type: "product" as const, product: p, key: p.id })),
    ]);

    const renderItem = ({ item }: { item: ListItem }) => {
        if (item.type === "header") {
            return <CategoryHeader title={item.category} />;
        }
        return (
            <ProductCard
                product={item.product}
                inBasket={isInBasket(item.product.id)}
                onPress={() =>
                    router.push({
                        pathname: `/add-ons/${item.product.slug}`,
                        params: {
                            orderId,
                        },
                    })
                }
                onAddToBasket={() =>
                    addItem({
                        productId: item.product.id,
                        name: item.product.name,
                        price: item.product.price,
                        imageUrl: item.product.image_url ?? undefined,
                        quantity: 1,
                    })
                }
            />
        );
    };

    // ── Loading skeleton ──────────────────────────────────────────────────────
    if (isLoading) {
        return (
            <ScreenWrapper
                scrollable={true}
                header={
                    <>
                        <NavBar
                            variant='logo'
                            subtitle='Add-ons'
                            showBackButton={true}
                            rightElement={
                                <BasketButton
                                    basketCount={basketCount}
                                    onPress={() =>
                                        router.push({
                                            pathname: `/add-ons/cart`,
                                            params: { orderId },
                                        })
                                    }
                                />
                            }
                        />
                        <PromoBanner />
                    </>
                }
                style={styles.safe}>
                <View style={styles.skeletonList}>
                    {Array.from({ length: 4 }).map((_, i) => (
                        <ProductCardSkeleton key={i} />
                    ))}
                </View>
            </ScreenWrapper>
        );
    }

    // ── Error ─────────────────────────────────────────────────────────────────
    if (isError) {
        return (
            <SafeAreaView style={styles.safe}>
                <StatusBar barStyle='light-content' backgroundColor={colors.charcoal} />
                <NavBar
                    variant='logo'
                    subtitle='Add-ons'
                    showBackButton={true}
                    rightElement={
                        <BasketButton
                            basketCount={basketCount}
                            onPress={() =>
                                router.push({
                                    pathname: `/add-ons/cart`,
                                    params: { orderId },
                                })
                            }
                        />
                    }
                />
                <ErrorState onRetry={refetch} />
            </SafeAreaView>
        );
    }

    // ── Main render ───────────────────────────────────────────────────────────
    return (
        <ScreenWrapper
            scrollable={false}
            header={
                <>
                    <NavBar
                        variant='logo'
                        subtitle='Add-ons'
                        showBackButton={true}
                        rightElement={
                            <BasketButton
                                basketCount={basketCount}
                                onPress={() =>
                                    router.push({
                                        pathname: `/add-ons/cart`,
                                        params: { orderId },
                                    })
                                }
                            />
                        }
                    />
                    <PromoBanner />
                </>
            }>
            <View style={{ flex: 1 }}>
                <FlatList
                    data={listData}
                    style={{ flex: 1 }}
                    keyExtractor={(item) => item.key}
                    renderItem={renderItem}
                    contentContainerStyle={[styles.listContent, listData.length === 0 && styles.listContentEmpty]}
                    ListHeaderComponent={
                        <View>
                            <SearchBar value={search} onChangeText={setSearch} />
                            <SortBar active={sort} onChange={setSort} />
                            {sorted.length > 0 && (
                                <Text style={styles.resultCount}>
                                    {sorted.length} item{sorted.length !== 1 ? "s" : ""}
                                </Text>
                            )}
                        </View>
                    }
                    ListEmptyComponent={<EmptyState query={search} />}
                    ListFooterComponent={<View style={{ height: basketCount > 0 ? 96 : spacing.xxxl }} />}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefetching}
                            onRefresh={refetch}
                            tintColor={colors.gold}
                            colors={[colors.gold]}
                        />
                    }
                    showsVerticalScrollIndicator={false}
                    removeClippedSubviews
                />
            </View>

            {/* <BasketBar count={basketCount} total={basketTotal} onPress={() => router.push("/add-ons/basket")} /> */}
            <CartSummaryBar orderId={orderId} />
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
        justifyContent: "space-between",
        alignItems: "center",
    },
    navLogo: {
        fontFamily: typography.fonts.serif,
        fontSize: typography.sizes.lg,
        color: colors.gold,
        letterSpacing: 0.5,
    },
    navSub: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.xs,
        color: colors.charcoalLight,
        marginTop: spacing.xxs,
        letterSpacing: 0.8,
        textTransform: "uppercase",
    },
    basketBtn: {
        position: "relative",
        padding: spacing.xs,
    },
    basketIcon: {
        fontSize: typography.sizes.xl,
    },
    basketBadge: {
        position: "absolute",
        top: 0,
        right: 0,
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
        color: colors.charcoal,
    },

    // Promo
    promoBanner: {
        backgroundColor: colors.creamMid,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
        borderBottomWidth: 0.5,
        borderColor: colors.border,
    },
    promoText: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.xs,
        color: colors.charcoalMid,
        textAlign: "center",
        letterSpacing: 0.3,
    },

    // Search
    searchRow: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
        paddingBottom: spacing.sm,
        backgroundColor: colors.cream,
    },
    searchInputWrap: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.white,
        borderWidth: 0.5,
        borderColor: colors.border,
        borderRadius: radii.md,
        paddingHorizontal: spacing.md,
        paddingVertical: Platform.OS === "ios" ? spacing.sm : spacing.xs,
        gap: spacing.sm,
    },
    searchIcon: {
        fontSize: 14,
    },
    searchInput: {
        flex: 1,
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.md,
        color: colors.charcoal,
        padding: 0,
    },
    clearBtn: {
        fontSize: typography.sizes.sm,
        color: colors.charcoalLight,
        paddingLeft: spacing.xs,
    },

    // Sort
    sortBar: {
        flexDirection: "row",
        gap: spacing.xs,
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.md,
        backgroundColor: colors.cream,
    },
    sortChip: {
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.md,
        borderRadius: radii.full,
        borderWidth: 0.5,
        borderColor: colors.border,
        backgroundColor: colors.white,
    },
    sortChipActive: {
        backgroundColor: colors.charcoal,
        borderColor: colors.charcoal,
    },
    sortChipText: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.sm,
        color: colors.charcoalMid,
    },
    sortChipTextActive: {
        color: colors.white,
        fontFamily: typography.fonts.sansMedium,
    },

    // Result count
    resultCount: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.xs,
        color: colors.charcoalLight,
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.sm,
        backgroundColor: colors.cream,
        letterSpacing: 0.3,
    },

    // Category header
    categoryHeader: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
        paddingBottom: spacing.sm,
        backgroundColor: colors.cream,
        gap: spacing.md,
    },
    categoryTitle: {
        fontFamily: typography.fonts.sansMedium,
        fontSize: typography.sizes.sm,
        color: colors.charcoalLight,
        textTransform: "uppercase",
        letterSpacing: 1,
        flexShrink: 0,
    },
    categoryLine: {
        flex: 1,
        height: 0.5,
        backgroundColor: colors.border,
    },

    // Product card
    card: {
        flexDirection: "row",
        backgroundColor: colors.white,
        borderRadius: radii.lg,
        borderWidth: 0.5,
        borderColor: colors.border,
        marginHorizontal: spacing.lg,
        marginBottom: spacing.md,
        overflow: "hidden",
        ...shadows.card,
    },
    cardImageWrap: {
        width: 180,
        position: "relative",
    },
    cardImage: {
        width: 180,
        height: 180,
        minHeight: 130,
    },
    cardImagePlaceholder: {
        width: 180,
        height: 180,
        backgroundColor: colors.goldPale,
        alignItems: "center",
        justifyContent: "center",
    },
    cardImagePlaceholderText: {
        fontSize: 24,
        color: colors.gold,
    },
    inBasketBadge: {
        position: "absolute",
        top: spacing.xs,
        left: spacing.xs,
        backgroundColor: colors.charcoal,
        borderRadius: radii.full,
        paddingVertical: 2,
        paddingHorizontal: spacing.xs,
    },
    inBasketText: {
        fontFamily: typography.fonts.sansMedium,
        fontSize: typography.sizes.xxs,
        color: colors.white,
        letterSpacing: 0.3,
    },
    cardBody: {
        flex: 1,
        padding: spacing.md,
        justifyContent: "space-between",
    },
    cardCategory: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.xxs,
        color: colors.charcoalLight,
        textTransform: "uppercase",
        letterSpacing: 0.8,
        marginBottom: spacing.xxs,
    },
    cardName: {
        fontFamily: typography.fonts.sansMedium,
        fontSize: typography.sizes.md,
        color: colors.charcoal,
        lineHeight: typography.sizes.md * 1.4,
        marginBottom: spacing.xs,
    },
    cardDescription: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.sm,
        color: colors.charcoalLight,
        lineHeight: typography.sizes.sm * 1.5,
        marginBottom: spacing.sm,
    },
    cardFooter: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: "auto",
    },
    cardPrice: {
        fontFamily: typography.fonts.sansMedium,
        fontSize: typography.sizes.lg,
        color: colors.gold,
    },
    addBtn: {
        backgroundColor: colors.charcoal,
        borderRadius: radii.sm,
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.md,
    },
    addBtnAdded: {
        backgroundColor: colors.goldPale,
        borderWidth: 0.5,
        borderColor: colors.borderGold,
    },
    addBtnText: {
        fontFamily: typography.fonts.sansMedium,
        fontSize: typography.sizes.sm,
        color: colors.white,
    },
    addBtnTextAdded: {
        color: colors.gold,
    },

    // Skeleton
    skeletonList: {
        flex: 1,
        backgroundColor: colors.cream,
        padding: spacing.lg,
        paddingTop: spacing.xl,
        gap: spacing.md,
    },
    skeletonCard: {
        opacity: 0.5,
    },
    skeletonImage: {
        width: 110,
        height: 130,
        backgroundColor: colors.creamMid,
    },
    skeletonLine: {
        height: 12,
        width: "90%",
        backgroundColor: colors.creamMid,
        borderRadius: radii.xs,
    },

    // Empty / error
    emptyState: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.section,
    },
    emptyIcon: {
        fontSize: 32,
        color: colors.goldLight,
        marginBottom: spacing.lg,
    },
    emptyTitle: {
        fontFamily: typography.fonts.sansMedium,
        fontSize: typography.sizes.lg,
        color: colors.charcoal,
        textAlign: "center",
        marginBottom: spacing.sm,
    },
    emptySubtitle: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.md,
        color: colors.charcoalLight,
        textAlign: "center",
        lineHeight: typography.sizes.md * 1.6,
    },
    retryBtn: {
        marginTop: spacing.lg,
        backgroundColor: colors.charcoal,
        borderRadius: radii.md,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
    },
    retryBtnText: {
        fontFamily: typography.fonts.sansMedium,
        fontSize: typography.sizes.md,
        color: colors.white,
    },

    // List
    listContent: {
        backgroundColor: colors.cream,
        paddingBottom: spacing.xl,
    },
    listContentEmpty: {
        flex: 1,
    },

    // Sticky basket bar
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
