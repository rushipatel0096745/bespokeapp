// Modern Mum Co — App Theme
// Based on Bespoke Foil Company branding
// Charcoal + Foil Gold + Warm Cream

export const colors = {
    // Core brand
    charcoal: "#1C1A17",
    charcoalMid: "#3D3A34",
    charcoalLight: "#6B665E",

    // Gold accent
    gold: "#C9A84C",
    goldLight: "#E8D49A",
    goldPale: "#F5EDD6",

    // Backgrounds
    cream: "#FAF7F2",
    creamMid: "#F2EDE4",
    white: "#FFFFFF",
    surface: "#f7f7f7",

    // Borders
    border: "#E8E0D4",
    borderGold: "#E8D49A",

    // Semantic
    success: "#2D6A4F",
    successBg: "#D8F3DC",
    error: "#B5200B",
    errorBg: "#FDECEA",
} as const;

export const typography = {
    // Font families — install via expo-google-fonts
    // npx expo install @expo-google-fonts/inter @expo-google-fonts/cormorant-garamond
    fonts: {
        serif: "CormorantGaramond_600SemiBoldItalic", // logo + splash only
        sans: "Inter_400Regular",
        sansMedium: "Inter_500Medium",
        sansBold: "Inter_600SemiBold",
    },

    sizes: {
        xxs: 10,
        xs: 11,
        sm: 12,
        base: 13,
        md: 14,
        lg: 16,
        xl: 18,
        xxl: 20,
        xxxl: 24,
        hero: 32,
    },

    lineHeights: {
        tight: 1.3,
        normal: 1.5,
        loose: 1.7,
    },

    letterSpacing: {
        tight: -0.3,
        normal: 0,
        wide: 0.5,
        wider: 1.0,
    },
} as const;

export const spacing = {
    xxs: 2,
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    section: 40,
} as const;

export const radii = {
    xs: 4,
    sm: 6,
    md: 8,
    lg: 12,
    xl: 16,
    xxl: 22,
    full: 999,
} as const;

export const shadows = {
    // React Native shadow (iOS) + elevation (Android)
    card: {
        shadowColor: "#1C1A17",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    nav: {
        shadowColor: "#1C1A17",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
} as const;

// ─── Component-level style presets ───────────────────────────────────────────

export const componentStyles = {
    // Screen container
    screen: {
        flex: 1,
        backgroundColor: colors.cream,
    },

    // Navigation bar (top)
    navBar: {
        backgroundColor: colors.charcoal,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        flexDirection: "row" as const,
        justifyContent: "space-between" as const,
        alignItems: "center" as const,
    },

    navLogo: {
        fontFamily: typography.fonts.serif,
        fontSize: typography.sizes.lg,
        color: colors.gold,
        letterSpacing: typography.letterSpacing.wide,
    },

    // Cards
    card: {
        backgroundColor: colors.white,
        borderRadius: radii.lg,
        borderWidth: 0.5,
        borderColor: colors.border,
        padding: spacing.lg,
    },

    cardGold: {
        backgroundColor: colors.goldPale,
        borderRadius: radii.lg,
        borderWidth: 0.5,
        borderColor: colors.borderGold,
        padding: spacing.lg,
    },

    // Buttons
    buttonPrimary: {
        backgroundColor: colors.charcoal,
        borderRadius: radii.md,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        alignItems: "center" as const,
    },

    buttonPrimaryText: {
        fontFamily: typography.fonts.sansMedium,
        fontSize: typography.sizes.md,
        color: colors.white,
        letterSpacing: typography.letterSpacing.wide,
    },

    buttonGold: {
        backgroundColor: colors.gold,
        borderRadius: radii.md,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        alignItems: "center" as const,
    },

    buttonGoldText: {
        fontFamily: typography.fonts.sansMedium,
        fontSize: typography.sizes.md,
        color: colors.charcoal,
        letterSpacing: typography.letterSpacing.wide,
    },

    buttonOutline: {
        backgroundColor: "transparent",
        borderRadius: radii.md,
        borderWidth: 0.5,
        borderColor: colors.charcoal,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        alignItems: "center" as const,
    },

    buttonOutlineText: {
        fontFamily: typography.fonts.sansMedium,
        fontSize: typography.sizes.md,
        color: colors.charcoal,
    },

    // Form inputs
    input: {
        backgroundColor: colors.white,
        borderWidth: 0.5,
        borderColor: colors.border,
        borderRadius: radii.sm,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.md,
        color: colors.charcoalMid,
    },

    inputLabel: {
        fontFamily: typography.fonts.sansMedium,
        fontSize: typography.sizes.sm,
        color: colors.charcoalMid,
        marginBottom: spacing.xs,
    },

    // Promo / notification banner
    promoBanner: {
        backgroundColor: colors.creamMid,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
        borderBottomWidth: 0.5,
        borderColor: colors.border,
    },

    promoBannerText: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.xs,
        color: colors.charcoalMid,
        textAlign: "center" as const,
        letterSpacing: typography.letterSpacing.wide,
    },

    // Status badge
    badgeGold: {
        backgroundColor: colors.gold,
        borderRadius: radii.full,
        paddingVertical: spacing.xxs,
        paddingHorizontal: spacing.sm,
    },

    badgeGoldText: {
        fontFamily: typography.fonts.sansMedium,
        fontSize: typography.sizes.xxs,
        color: colors.white,
    },

    // Section header
    sectionTitle: {
        fontFamily: typography.fonts.sansMedium,
        fontSize: typography.sizes.md,
        color: colors.charcoal,
    },

    sectionSubtitle: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.xs,
        color: colors.charcoalLight,
        marginTop: spacing.xxs,
    },

    // Chat bubbles
    bubbleAgent: {
        backgroundColor: colors.white,
        borderRadius: radii.lg,
        borderTopLeftRadius: radii.xs,
        borderWidth: 0.5,
        borderColor: colors.border,
        padding: spacing.md,
        maxWidth: "80%",
    },

    bubbleBot: {
        backgroundColor: colors.goldPale,
        borderRadius: radii.lg,
        borderTopLeftRadius: radii.xs,
        borderWidth: 0.5,
        borderColor: colors.borderGold,
        padding: spacing.md,
        maxWidth: "80%",
    },

    bubbleUser: {
        backgroundColor: colors.charcoal,
        borderRadius: radii.lg,
        borderTopRightRadius: radii.xs,
        padding: spacing.md,
        maxWidth: "80%",
        alignSelf: "flex-end" as const,
    },

    bubbleTextAgent: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.base,
        color: colors.charcoalMid,
        lineHeight: typography.sizes.base * typography.lineHeights.normal,
    },

    bubbleTextUser: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.base,
        color: colors.white,
        lineHeight: typography.sizes.base * typography.lineHeights.normal,
    },

    // Quick reply chips
    quickReply: {
        borderWidth: 0.5,
        borderColor: colors.charcoal,
        borderRadius: radii.sm,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        backgroundColor: "transparent",
    },

    quickReplyGold: {
        borderWidth: 0.5,
        borderColor: colors.gold,
        borderRadius: radii.sm,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        backgroundColor: colors.goldPale,
    },

    quickReplyText: {
        fontFamily: typography.fonts.sansMedium,
        fontSize: typography.sizes.base,
        color: colors.charcoal,
    },

    quickReplyGoldText: {
        fontFamily: typography.fonts.sansMedium,
        fontSize: typography.sizes.base,
        color: colors.gold,
    },

    // Bottom tab bar
    tabBar: {
        backgroundColor: colors.white,
        borderTopWidth: 0.5,
        borderTopColor: colors.border,
        paddingBottom: spacing.sm,
        paddingTop: spacing.sm,
    },
} as const;

// ─── Helper: merge styles (lightweight alternative to StyleSheet.create) ──────
type Style = Record<string, unknown>;
export const merge = (...styles: (Style | false | undefined)[]): Style => Object.assign({}, ...styles.filter(Boolean));
