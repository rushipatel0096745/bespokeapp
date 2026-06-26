import React from "react";
import { StyleSheet, StatusBar, ViewStyle, ScrollView, View, Platform } from "react-native";
import { SafeAreaView, Edge, useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing } from "../../theme/theme";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScreenWrapperProps {
    children: React.ReactNode;
    /**
     * "scroll"  — wraps children in a ScrollView (default for most screens)
     * "flat"    — plain View, no scroll (use when child manages its own scroll/FlatList)
     */
    scrollable?: boolean;
    /** Extra style on the outer SafeAreaView */
    style?: ViewStyle;
    /** Extra style on the scroll content container */
    contentStyle?: ViewStyle;
    /**
     * Which edges to apply safe-area padding to.
     * Defaults to ["top"] — NavBar sits flush with status bar;
     * tab screens don't need bottom because the tab bar handles it.
     */
    edges?: Edge[];
    withTabBar?: boolean;

    header?: React.ReactNode;
}

const TAB_BAR_HEIGHT = 64;
const TAB_BAR_BOTTOM_OFFSET = Platform.OS === "ios" ? 24 : 16;
const TAB_BAR_MARGIN = 12; // breathing room above bar

// ─── Component ────────────────────────────────────────────────────────────────

export default function ScreenWrapper({
    children,
    scrollable = true,
    style,
    contentStyle,
    edges = ["top"],
    // edges = ["top", "left", "right", "bottom"],
    withTabBar = false,
    header,
}: ScreenWrapperProps) {
    const insets = useSafeAreaInsets();
    const tabBarPadding = withTabBar ? TAB_BAR_HEIGHT + TAB_BAR_BOTTOM_OFFSET + TAB_BAR_MARGIN + insets.bottom : 0;
    return (
        <SafeAreaView style={[styles.safe, style]} edges={edges}>
            <StatusBar barStyle='light-content' backgroundColor={colors.charcoal} />

            {header}

            {scrollable ? (
                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={[styles.scrollContent, contentStyle, { paddingBottom: tabBarPadding }]}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps='handled'>
                    {children}
                </ScrollView>
            ) : (
                <View style={[styles.flat, { paddingBottom: tabBarPadding }]}>
                    <View
                        style={[
                            {
                                flex: 1,
                            },
                            contentStyle,
                        ]}>
                        {children}
                    </View>
                </View>
            )}
        </SafeAreaView>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: colors.charcoal, // fills status bar on charcoal NavBar
    },
    scroll: {
        flex: 1,
        backgroundColor: colors.cream,
    },
    scrollContent: {
        paddingBottom: spacing.xxxl, // breathing room above tab bar
    },
    flat: {
        flex: 1,
        backgroundColor: colors.cream,
    },
});
