import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert } from "react-native";
import { router } from "expo-router";
import { colors, typography, spacing, radii } from "@/theme/theme";
import ScreenWrapper from "@/components/layout/ScreenWrapper";
import NavBar from "@/components/layout/NavBar";
import { useAuth } from "@/context/AuthContext";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatMemberSince(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-GB", {
        month: "long",
        year: "numeric",
    });
}

function formatChildAge(val: string | null) {
    if (!val) return null;
    const map: Record<string, string> = {
        newborn: "Newborn",
        "3_months": "3 months",
        "6_months": "6 months",
        "1_year": "1 year",
        "2_years": "2 years",
        "3_years": "3+ years",
    };
    return map[val] ?? val.replace(/_/g, " ");
}

function getInitials(first?: string | null, last?: string | null) {
    return `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase() || "?";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
    return <Text style={sectionStyles.header}>{title}</Text>;
}

function MenuRow({
    icon,
    label,
    sublabel,
    onPress,
    destructive,
}: {
    icon: string;
    label: string;
    sublabel?: string;
    onPress: () => void;
    destructive?: boolean;
}) {
    return (
        <TouchableOpacity style={menuStyles.row} onPress={onPress} activeOpacity={0.65}>
            <View style={menuStyles.iconWrap}>
                <Text style={menuStyles.icon}>{icon}</Text>
            </View>
            <View style={menuStyles.labelWrap}>
                <Text style={[menuStyles.label, destructive && menuStyles.destructive]}>{label}</Text>
                {sublabel && <Text style={menuStyles.sublabel}>{sublabel}</Text>}
            </View>
            {!destructive && <Text style={menuStyles.chevron}>›</Text>}
        </TouchableOpacity>
    );
}

function Divider() {
    return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginLeft: 52 }} />;
}

function Card({ children }: { children: React.ReactNode }) {
    return <View style={cardStyles.card}>{children}</View>;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ProfileScreen() {
    const { profile, signOut } = useAuth();

    const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ");
    const childAge = formatChildAge(profile?.youngest_child_age ?? null);
    const memberSince = profile?.created_at ? formatMemberSince(profile.created_at) : null;

    function handleSignOut() {
        Alert.alert("Log out", "Are you sure you want to log out?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Log out",
                style: "destructive",
                onPress: signOut,
            },
        ]);
    }

    return (
        <ScreenWrapper scrollable header={<NavBar title='Profile' showBackButton={false} />}>
            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                {/* ── Avatar + identity ── */}
                <View style={styles.heroSection}>
                    <View style={avatarStyles.wrap}>
                        {profile?.avatar_url ? (
                            <Image source={{ uri: profile.avatar_url }} style={avatarStyles.image} />
                        ) : (
                            <View style={avatarStyles.placeholder}>
                                <Text style={avatarStyles.initials}>
                                    {getInitials(profile?.first_name, profile?.last_name)}
                                </Text>
                            </View>
                        )}
                        <TouchableOpacity
                            style={avatarStyles.editBadge}
                            onPress={() => router.push("/profile/edit-photo")}
                            activeOpacity={0.8}>
                            <Text style={avatarStyles.editBadgeText}>✎</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.name}>{fullName || "Your name"}</Text>
                    <Text style={styles.email}>{profile?.email ?? ""}</Text>

                    <View style={styles.metaRow}>
                        {childAge && (
                            <View style={styles.metaPill}>
                                <Text style={styles.metaPillText}>👶 {childAge}</Text>
                            </View>
                        )}
                        {memberSince && (
                            <View style={styles.metaPill}>
                                <Text style={styles.metaPillText}>🌸 Member since {memberSince}</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* ── My account ── */}
                <SectionHeader title='My account' />
                <Card>
                    <MenuRow
                        icon='📦'
                        label='My orders'
                        sublabel='View all print submissions'
                        onPress={() => router.push("/orders")}
                    />
                    <Divider />
                    <MenuRow
                        icon='🔖'
                        label='Saved posts'
                        sublabel='Bookmarked community content'
                        onPress={() => router.push("/profile/saved-posts")}
                    />
                </Card>

                {/* ── Preferences ── */}
                <SectionHeader title='Preferences' />
                <Card>
                    <MenuRow
                        icon='🔔'
                        label='Notification preferences'
                        onPress={() => router.push("/profile/notifications")}
                    />
                </Card>

                {/* ── Account settings ── */}
                <SectionHeader title='Account settings' />
                <Card>
                    <MenuRow
                        icon='✉️'
                        label='Change email'
                        sublabel={profile?.email ?? undefined}
                        onPress={() => router.push("/change-email")}
                    />
                    <Divider />
                    <MenuRow icon='🔒' label='Change password' onPress={() => router.push("/change-password")} />
                </Card>

                {/* ── Log out ── */}
                <Card>
                    <MenuRow icon='🚪' label='Log out' onPress={handleSignOut} destructive />
                </Card>

                <View style={{ height: spacing.xl }} />
            </ScrollView>
        </ScreenWrapper>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: spacing.md,
        paddingTop: spacing.lg,
        gap: spacing.sm,
    },
    heroSection: {
        alignItems: "center",
        paddingBottom: spacing.lg,
        gap: spacing.xs,
    },
    name: {
        fontFamily: typography.fonts.serif,
        fontSize: typography.sizes.xl,
        color: colors.charcoal,
        marginTop: spacing.sm,
    },
    email: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.sm,
        color: colors.charcoalLight,
    },
    metaRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: spacing.xs,
        justifyContent: "center",
        marginTop: spacing.xs,
    },
    metaPill: {
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        backgroundColor: colors.gold + "18",
        borderRadius: radii.full,
        borderWidth: 1,
        borderColor: colors.gold + "40",
    },
    metaPillText: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.xs,
        color: colors.charcoal,
    },
});

const avatarStyles = StyleSheet.create({
    wrap: {
        position: "relative",
        width: 88,
        height: 88,
    },
    image: {
        width: 88,
        height: 88,
        borderRadius: 44,
    },
    placeholder: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: colors.gold + "30",
        borderWidth: 2,
        borderColor: colors.gold,
        alignItems: "center",
        justifyContent: "center",
    },
    initials: {
        fontFamily: typography.fonts.serif,
        fontSize: typography.sizes.xl,
        color: colors.gold,
    },
    editBadge: {
        position: "absolute",
        bottom: 0,
        right: 0,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: colors.gold,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 2,
        borderColor: colors.white ?? "#fff",
    },
    editBadgeText: {
        fontSize: 13,
        color: colors.white ?? "#fff",
    },
});

const sectionStyles = StyleSheet.create({
    header: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.xs,
        fontWeight: "600",
        color: colors.charcoalLight,
        letterSpacing: 0.8,
        textTransform: "uppercase",
        marginTop: spacing.sm,
        marginBottom: 2,
        paddingHorizontal: spacing.xs,
    },
});

const cardStyles = StyleSheet.create({
    card: {
        backgroundColor: colors.white ?? "#fff",
        borderRadius: radii.lg ?? radii.md,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: "hidden",
    },
});

const menuStyles = StyleSheet.create({
    row: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm + 2,
        gap: spacing.sm,
    },
    iconWrap: {
        width: 28,
        alignItems: "center",
    },
    icon: {
        fontSize: 18,
    },
    labelWrap: {
        flex: 1,
        gap: 1,
    },
    label: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.sm,
        color: colors.charcoal,
        fontWeight: "500",
    },
    sublabel: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.xs,
        color: colors.charcoalLight,
    },
    chevron: {
        fontSize: 20,
        color: colors.charcoalLight,
        lineHeight: 22,
    },
    destructive: {
        color: colors.error ?? "#C0392B",
    },
});
