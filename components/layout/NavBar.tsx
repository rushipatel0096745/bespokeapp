import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { colors, typography, spacing } from "../../theme/theme";

interface NavBarProps {
    variant?: "logo" | "back" | "title";
    title?: string;
    subtitle?: string;
    showBackButton?: boolean;
    rightElement?: React.ReactNode;
    style?: ViewStyle;
    onBack?: () => void;
}

export default function NavBar({
    variant = "logo",
    title,
    subtitle,
    showBackButton,
    rightElement,
    style,
    onBack,
}: NavBarProps) {
    const router = useRouter();
    // const insets = useSafeAreaInsets();

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else if (router.canGoBack()) {
            router.back();
        }
    };

    return (
        <View style={[styles.bar, { paddingTop: 12 }, style]}>
            <View style={styles.left}>
                {(variant === "back" || showBackButton) && (
                    <TouchableOpacity
                        onPress={handleBack}
                        accessibilityRole='button'
                        accessibilityLabel='Go back'
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                        style={styles.backBtn}>
                        <Ionicons name='chevron-back' size={24} color={colors.cream} />
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.centre}>
                {variant === "logo" ? (
                    <>
                        <Text style={styles.logo}>Modern Mum Co®</Text>

                        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
                    </>
                ) : (
                    <>
                        {title && (
                            <Text style={styles.title} numberOfLines={1}>
                                {title}
                            </Text>
                        )}

                        {subtitle && (
                            <Text style={styles.subtitle} numberOfLines={1}>
                                {subtitle}
                            </Text>
                        )}
                    </>
                )}
            </View>

            <View style={styles.right}>{rightElement ?? null}</View>
        </View>
    );
}

const styles = StyleSheet.create({
    bar: {
        backgroundColor: colors.charcoal,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: spacing.md,
        paddingBottom: 12,
    },
    left: {
        width: 48,
        alignItems: "flex-start",
        justifyContent: "center",
    },
    centre: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    right: {
        width: 48,
        alignItems: "flex-end",
        justifyContent: "center",
    },
    logo: {
        fontFamily: typography.fonts.serif,
        fontSize: typography.sizes.lg,
        color: colors.gold,
        letterSpacing: 0.2,
    },
    title: {
        fontFamily: typography.fonts.sansMedium,
        fontSize: typography.sizes.xl,
        color: colors.gold,
        // color: colors.cream,
        letterSpacing: 0.3,
    },
    subtitle: {
        marginTop: 2,
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.xs,
        color: colors.goldLight,
    },
    backBtn: {
        justifyContent: "center",
        alignItems: "center",
    },
});

// import React from "react";
// import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from "react-native";
// import { useRouter } from "expo-router";
// import { colors, typography, spacing } from "../../theme/theme";

// // ─── Types ────────────────────────────────────────────────────────────────────

// interface NavBarProps {
//     /**
//      * "logo"  — shows the Modern Mum Co® wordmark (root tab screens)
//      * "back"  — shows ← chevron + optional title (stack screens)
//      * "title" — shows centred title only (e.g. Basket)
//      */
//     variant?: "logo" | "back" | "title";
//     title?: string;
//     /** Optional right-side element (notification bell, action button, etc.) */
//     rightElement?: React.ReactNode;
//     style?: ViewStyle;
//     /** Called on back press — defaults to router.back() */
//     onBack?: () => void;
// }

// // ─── Component ────────────────────────────────────────────────────────────────

// export default function NavBar({ variant = "logo", title, rightElement, style, onBack }: NavBarProps) {
//     const router = useRouter();

//     const handleBack = () => {
//         if (onBack) {
//             onBack();
//         } else if (router.canGoBack()) {
//             router.back();
//         }
//     };

//     return (
//         <View style={[styles.bar, style]}>
//             {/* Left slot */}
//             <View style={styles.left}>
//                 {variant === "back" && (
//                     <TouchableOpacity
//                         onPress={handleBack}
//                         accessibilityRole='button'
//                         accessibilityLabel='Go back'
//                         hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
//                         style={styles.backBtn}>
//                         {/* Replace with Ionicons chevron-back when icons are installed */}
//                         <Text style={styles.backChevron}>‹</Text>
//                     </TouchableOpacity>
//                 )}
//             </View>

//             {/* Centre slot */}
//             <View style={styles.centre}>
//                 {variant === "logo" ? (
//                     <Text style={styles.logo} accessibilityRole='header'>
//                         Modern Mum Co®
//                     </Text>
//                 ) : (
//                     title && (
//                         <Text style={styles.title} numberOfLines={1} accessibilityRole='header'>
//                             {title}
//                         </Text>
//                     )
//                 )}
//             </View>

//             {/* Right slot */}
//             <View style={styles.right}>{rightElement ?? null}</View>
//         </View>
//     );
// }

// // ─── Styles ───────────────────────────────────────────────────────────────────

// const styles = StyleSheet.create({
//     bar: {
//         height: 56,
//         backgroundColor: colors.charcoal,
//         flexDirection: "row",
//         alignItems: "center",
//         paddingHorizontal: spacing.md,
//     },
//     left: {
//         width: 48,
//         alignItems: "flex-start",
//         justifyContent: "center",
//     },
//     centre: {
//         flex: 1,
//         alignItems: "center",
//     },
//     right: {
//         width: 48,
//         alignItems: "flex-end",
//         justifyContent: "center",
//     },
//     logo: {
//         fontFamily: typography.fonts.serif,
//         fontSize: typography.sizes.lg,
//         color: colors.gold,
//         letterSpacing: 0.2,
//     },
//     title: {
//         fontFamily: typography.fonts.sansMedium,
//         fontSize: typography.sizes.base,
//         color: colors.cream,
//         letterSpacing: 0.3,
//     },
//     backBtn: {
//         justifyContent: "center",
//     },
//     backChevron: {
//         fontSize: 28,
//         color: colors.cream,
//         lineHeight: 32,
//         fontFamily: typography.fonts.sans,
//     },
// });
