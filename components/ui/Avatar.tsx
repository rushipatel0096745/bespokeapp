import { View, Text, Image, StyleSheet, ViewStyle, ImageStyle, StyleProp } from "react-native";
import { colors, typography, radii } from "../../theme/theme";

// ─── Types ────────────────────────────────────────────────────────────────────

type AvatarSize = "xs" | "sm" | "md" | "lg";

// interface AvatarProps {
//     /** Display name — used to derive initials when no uri is given */
//     name: string;
//     uri?: string | null;
//     size?: AvatarSize;
//     style?: StyleProp<ViewStyle | ImageStyle>;
// }

interface AvatarProps {
    /** Display name — used to derive initials when no uri is given */
    name: string;
    uri?: string | null;
    size?: AvatarSize;

    containerStyle?: StyleProp<ViewStyle>;
    imageStyle?: StyleProp<ImageStyle>;
}

// ─── Size map ─────────────────────────────────────────────────────────────────

const SIZE: Record<AvatarSize, number> = {
    xs: 28,
    sm: 36,
    md: 48,
    lg: 64,
};

const FONT_SIZE: Record<AvatarSize, number> = {
    xs: 10,
    sm: 13,
    md: 17,
    lg: 22,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/** Deterministic pastel bg from name — keeps colours consistent per user */
function getColor(name: string): string {
    const palette = [
        "#D4C5B0", // warm taupe
        "#B8C9C0", // sage
        "#C5BAD4", // dusty lavender
        "#C9B8B8", // muted rose
        "#B8C4C9", // slate blue
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return palette[Math.abs(hash) % palette.length];
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Avatar({ name, uri, size = "md", containerStyle, imageStyle }: AvatarProps) {
    const dim = SIZE[size];
    const fontSize = FONT_SIZE[size];

    if (uri) {
        return (
            <Image
                source={{ uri }}
                style={[styles.base, { width: dim, height: dim, borderRadius: dim / 2 }, imageStyle]}
                accessibilityLabel={`${name}'s profile photo`}
            />
        );
    }

    return (
        <View
            style={[
                styles.base,
                {
                    width: dim,
                    height: dim,
                    borderRadius: dim / 2,
                    backgroundColor: getColor(name),
                },
                containerStyle,
            ]}
            accessibilityLabel={`${name}'s avatar — initials ${getInitials(name)}`}>
            <Text style={[styles.initials, { fontSize }]}>{getInitials(name)}</Text>
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    base: {
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
    },
    initials: {
        fontFamily: typography.fonts.sansMedium,
        color: colors.charcoal,
        includeFontPadding: false,
    },
});
