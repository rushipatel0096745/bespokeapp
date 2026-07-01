// components/community/ReactionBar.tsx
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, radii, spacing, typography } from "@/theme/theme";
import type { ReactionSummary, ReactionType } from "@/types/Community";

const REACTIONS: { type: ReactionType; emoji: string; label: string }[] = [
    { type: "heart", emoji: "❤️", label: "Heart" },
    { type: "hug", emoji: "🤗", label: "Hug" },
    { type: "relate", emoji: "🙌", label: "Relate" },
    { type: "laugh", emoji: "😄", label: "Laugh" },
];

type Props = {
    reactions: ReactionSummary;
    onReact: (type: ReactionType) => void;
    disabled?: boolean;
};

export function ReactionBar({ reactions, onReact, disabled = false }: Props) {
    return (
        <View style={styles.row}>
            {REACTIONS.map((r) => {
                const count = reactions.counts[r.type] ?? 0;
                const isActive = reactions.user_reaction === r.type;

                return (
                    <TouchableOpacity
                        key={r.type}
                        style={[styles.btn, isActive && styles.btnActive]}
                        onPress={() => onReact(r.type)}
                        disabled={disabled}
                        activeOpacity={0.7}
                        accessibilityLabel={`${r.label}${count > 0 ? `, ${count}` : ""}`}
                        accessibilityRole='button'>
                        <Text style={styles.emoji}>{r.emoji}</Text>
                        {count > 0 && <Text style={[styles.count, isActive && styles.countActive]}>{count}</Text>}
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: "row",
        gap: spacing.sm,
    },
    btn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.sm,
        borderRadius: radii.full,
        borderWidth: 0.5,
        borderColor: colors.border,
        backgroundColor: colors.white,
    },
    btnActive: {
        borderColor: colors.goldLight,
        backgroundColor: colors.goldPale,
    },
    emoji: {
        fontSize: typography.sizes.base,
    },
    count: {
        fontFamily: typography.fonts.sansMedium,
        fontSize: typography.sizes.xs,
        color: colors.charcoalLight,
    },
    countActive: {
        color: colors.gold,
    },
});
